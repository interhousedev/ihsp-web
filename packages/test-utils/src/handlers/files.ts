import type { FileCreateBody, FileItem, FileRenameBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { TEST_STORAGE_URL } from "../fixtures/env"
import { fileItems, pendingFile, storageInfo, uploadTargetFor } from "../fixtures/files"
import { apiUrl, nextId, notFound, paginate, param, problem, query, readJson } from "./utils"

/** Files created through `POST /v1/files` in this process, so `complete` can answer with the right name. */
const created = new Map<string, FileItem>()

/** What the presigned `PUT` of each created file must carry (the S3 signature covers these two headers). */
type UploadExpectation = { contentType: string; sha256_b64: string }
const expectations = new Map<string, UploadExpectation>()

/** Objects that were stored through a presigned `PUT` (file id to byte size), for assertions in tests. */
export const storedObjects = new Map<string, number>()

export function resetCreatedFiles(): void {
  created.clear()
  expectations.clear()
  storedObjects.clear()
}

async function sha256Base64OfBody(request: Request): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await request.arrayBuffer())
  let binary = ""
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function storageDenied(code: string, message: string): Response {
  return new HttpResponse(`<Error><Code>${code}</Code><Message>${message}</Message></Error>`, {
    status: 403,
    headers: { "Content-Type": "application/xml" },
  })
}

function findFile(id: string): FileItem | undefined {
  return created.get(id) ?? fileItems.find((item) => item.id === id)
}

const MAX_BYTES = 50 * 1024 * 1024

export const filesHandlers = [
  /**
   * The mocked backend refuses `.exe` names (`files/type-not-allowed`) and sizes above 50 MB (`files/too-large`);
   * otherwise it returns a presigned `PUT` target whose headers carry the content type and the SHA-256 checksum.
   */
  http.post(apiUrl("/v1/files"), async ({ request }) => {
    const body = await readJson<FileCreateBody>(request)
    const name = body.name ?? "upload.bin"
    if (name.toLowerCase().endsWith(".exe")) {
      return problem(415, "files/type-not-allowed", "This file type is not allowed")
    }
    if ((body.size ?? 0) > MAX_BYTES) {
      return problem(413, "files/too-large", "The file is too large", { params: { max_bytes: MAX_BYTES } })
    }
    const file = pendingFile({
      id: nextId(8),
      name,
      size: body.size ?? 0,
      contentType: body.content_type ?? "application/octet-stream",
      purpose: body.purpose ?? "link",
    })
    const sha256_b64 = body.sha256_b64 ?? ""
    created.set(file.id, file)
    expectations.set(file.id, { contentType: file.content_type, sha256_b64 })
    return HttpResponse.json({
      file,
      upload: uploadTargetFor(file.id, {
        "Content-Type": file.content_type,
        "x-amz-checksum-sha256": sha256_b64,
      }),
    })
  }),
  http.post(apiUrl("/v1/files/:id/complete"), ({ params }) => {
    const file = findFile(param(params, "id"))
    if (!file) return notFound("File")
    const ready: FileItem = {
      ...file,
      status: "ready",
      text_bytes:
        file.content_type.startsWith("text/") || file.content_type === "application/pdf" ? file.byte_size : null,
      assistant_ready: file.content_type.startsWith("text/") || file.content_type === "application/pdf",
    }
    created.set(ready.id, ready)
    return HttpResponse.json(ready)
  }),
  http.get(apiUrl("/v1/files/:id/url"), ({ params, request }) => {
    const id = param(params, "id")
    if (!findFile(id)) return notFound("File")
    const disposition = query(request).get("disposition") ?? "attachment"
    return HttpResponse.json({
      url: `${TEST_STORAGE_URL}/files/${id}?disposition=${disposition}&signature=test`,
      expires_at: "2026-10-07T05:13:00Z",
    })
  }),
  http.get(apiUrl("/v1/files/:id"), ({ params }) => {
    const file = findFile(param(params, "id"))
    return file ? HttpResponse.json(file) : notFound("File")
  }),
  http.patch(apiUrl("/v1/files/:id"), async ({ params, request }) => {
    const file = findFile(param(params, "id"))
    if (!file) return notFound("File")
    const body = await readJson<FileRenameBody>(request)
    return HttpResponse.json({ ...file, name: body.name ?? file.name })
  }),
  http.delete(apiUrl("/v1/files/:id"), ({ params }) => {
    const file = findFile(param(params, "id"))
    if (!file) return notFound("File")
    created.delete(file.id)
    return HttpResponse.json({ used_by: file.used_by })
  }),
  http.get(apiUrl("/v1/me/files"), ({ request }) => {
    const search = query(request)
    const purpose = search.get("purpose")
    const q = search.get("q")?.toLowerCase() ?? ""
    const type = search.get("type")
    const typeOf = (contentType: string) =>
      contentType === "application/pdf" ? "pdf" : contentType.startsWith("image/") ? "image" : "other"
    const items = [...fileItems, ...created.values()]
      .filter((item) => !purpose || item.purpose === purpose)
      .filter((item) => q === "" || item.name.toLowerCase().includes(q))
      .filter((item) => !type || typeOf(item.content_type) === type)
      .toSorted((a, b) =>
        search.get("sort") === "older"
          ? a.created_at.localeCompare(b.created_at)
          : b.created_at.localeCompare(a.created_at),
      )
    const page = search.get("page")
    if (page) {
      const size = Number(search.get("page_size") ?? 20)
      const number = Number(page)
      const slice = items.slice((number - 1) * size, number * size)
      return HttpResponse.json({ items: slice, next_cursor: number * size < items.length ? String(number + 1) : null })
    }
    return HttpResponse.json(paginate(items, request))
  }),
  http.get(apiUrl("/v1/me/storage"), () => HttpResponse.json(storageInfo)),

  /**
   * The object store that receives the presigned `PUT`. Like S3 with a signed `Content-Type` and
   * `x-amz-checksum-sha256`, it answers `403` when either header is missing or differs from what `POST /v1/files`
   * returned, or when the checksum is not the base64 SHA-256 of the body it received.
   */
  http.put(`${TEST_STORAGE_URL}/uploads/:id`, async ({ params, request }) => {
    const id = param(params, "id")
    const expected = expectations.get(id)
    if (!expected) return storageDenied("NoSuchUpload", "Unknown upload")
    const contentType = request.headers.get("Content-Type")
    if (contentType !== expected.contentType) {
      return storageDenied("SignatureDoesNotMatch", `Content-Type must be ${expected.contentType}`)
    }
    const declared = request.headers.get("x-amz-checksum-sha256")
    if (declared !== expected.sha256_b64) {
      return storageDenied("SignatureDoesNotMatch", "x-amz-checksum-sha256 does not match the signed value")
    }
    const body = await request.clone().arrayBuffer()
    if ((await sha256Base64OfBody(request)) !== declared) {
      return storageDenied("BadDigest", "The SHA-256 checksum does not match the data")
    }
    storedObjects.set(id, body.byteLength)
    return new HttpResponse(null, { status: 200 })
  }),
]
