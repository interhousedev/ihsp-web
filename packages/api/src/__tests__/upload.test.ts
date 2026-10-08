import { describe, expect, test } from "bun:test"
import { TEST_STORAGE_URL, apiUrl, errorHandlers, filePdf, server, storedObjects } from "@ihsp/test-utils"
import { HttpResponse, http } from "msw"
import { ApiError } from "../errors"
import { sha256Base64, uploadFile } from "../upload"

/** Base64 of the raw SHA-256 digest, computed independently of `sha256Base64`. */
async function expectedChecksum(text: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))
  return btoa(String.fromCharCode(...digest))
}

function textFile(text: string, name = "notes.txt", type = "text/plain"): File {
  return new File([text], name, { type })
}

type Captured = { contentType: string | null; checksum: string | null; bodyBytes: number }

/** Replaces the storage handler with one that records the headers of the presigned `PUT`. */
function captureStorage(): { captured: Captured[] } {
  const captured: Captured[] = []
  server.use(
    http.put(`${TEST_STORAGE_URL}/uploads/:id`, async ({ request }) => {
      captured.push({
        contentType: request.headers.get("Content-Type"),
        checksum: request.headers.get("x-amz-checksum-sha256"),
        bodyBytes: (await request.arrayBuffer()).byteLength,
      })
      return new HttpResponse(null, { status: 200 })
    }),
  )
  return { captured }
}

describe("sha256Base64", () => {
  test("is the base64 of the raw digest, not hex", async () => {
    const checksum = await sha256Base64(textFile("hello"))
    expect(checksum).toBe("LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=")
    expect(checksum).toBe(await expectedChecksum("hello"))
    expect(checksum).not.toMatch(/^[0-9a-f]{64}$/)
  })
})

describe("uploadFile", () => {
  test("the tests run with XMLHttpRequest, so the XHR branch (with progress) is the one under test", () => {
    expect(typeof XMLHttpRequest).toBe("function")
  })

  test("PUTs with the returned Content-Type and a base64 SHA-256 checksum, then completes", async () => {
    const { captured } = captureStorage()
    const progress: number[] = []
    const file = await uploadFile(textFile("hello world"), "link", (fraction) => progress.push(fraction))
    expect(file.status).toBe("ready")
    expect(file.name).toBe("notes.txt")
    expect(file.content_type).toBe("text/plain")
    expect(captured).toHaveLength(1)
    expect(captured[0]?.contentType).toBe("text/plain")
    expect(captured[0]?.checksum).toBe(await expectedChecksum("hello world"))
    expect(captured[0]?.bodyBytes).toBe(11)
    expect(progress.at(-1)).toBe(1)
  })

  test("sends exactly the headers of the upload info of POST /v1/files", async () => {
    const { captured } = captureStorage()
    server.use(
      http.post("http://localhost:8000/v1/files", async ({ request }) => {
        const body = (await request.json()) as { name: string; size: number; content_type: string; sha256_b64: string }
        return HttpResponse.json({
          file: {
            id: "f-custom",
            name: body.name,
            content_type: body.content_type,
            byte_size: body.size,
            purpose: "link",
            status: "pending",
            reject_reason: null,
            text_bytes: null,
            assistant_ready: false,
            created_at: "2026-10-07T05:12:00Z",
            expires_on: "2027-01-15",
            used_by: [],
          },
          upload: {
            url: `${TEST_STORAGE_URL}/uploads/f-custom`,
            method: "PUT",
            headers: { "Content-Type": body.content_type, "x-amz-checksum-sha256": body.sha256_b64 },
          },
        })
      }),
      http.post("http://localhost:8000/v1/files/f-custom/complete", () =>
        HttpResponse.json({
          id: "f-custom",
          name: "notes.txt",
          content_type: "text/plain",
          byte_size: 3,
          purpose: "link",
          status: "ready",
          reject_reason: null,
          text_bytes: 3,
          assistant_ready: true,
          created_at: "2026-10-07T05:12:00Z",
          expires_on: "2027-01-15",
          used_by: [],
        }),
      ),
    )
    const file = await uploadFile(textFile("abc"), "link")
    expect(file.id).toBe("f-custom")
    expect(captured[0]?.contentType).toBe("text/plain")
    expect(captured[0]?.checksum).toBe(await expectedChecksum("abc"))
  })

  test("a file without a type is uploaded as application/octet-stream", async () => {
    const { captured } = captureStorage()
    await uploadFile(new File(["x"], "data.bin"), "link")
    expect(captured[0]?.contentType).toBe("application/octet-stream")
  })

  test("the mocked object store keeps what it received", async () => {
    const file = await uploadFile(textFile("stored"), "link")
    expect(storedObjects.get(file.id)).toBe(6)
  })

  test("a file that is still being verified is polled until it is ready", async () => {
    let checks = 0
    server.use(
      http.post(apiUrl("/v1/files/:id/complete"), ({ params }) =>
        HttpResponse.json({ ...filePdf, id: String(params.id), status: "processing" }),
      ),
      http.get(apiUrl("/v1/files/:id"), ({ params }) => {
        checks += 1
        return HttpResponse.json({ ...filePdf, id: String(params.id), status: checks < 3 ? "processing" : "ready" })
      }),
    )
    const file = await uploadFile(textFile("hello"), "link", undefined, { pollIntervalMs: 5 })

    expect(file.status).toBe("ready")
    expect(checks).toBe(3)
  })

  test("a file that fails the verification comes back rejected with its reason", async () => {
    server.use(
      http.post(apiUrl("/v1/files/:id/complete"), ({ params }) =>
        HttpResponse.json({ ...filePdf, id: String(params.id), status: "processing" }),
      ),
      http.get(apiUrl("/v1/files/:id"), ({ params }) =>
        HttpResponse.json({ ...filePdf, id: String(params.id), status: "rejected", reject_reason: "infected" }),
      ),
    )
    const file = await uploadFile(textFile("hello"), "link", undefined, { pollIntervalMs: 5 })

    expect(file.status).toBe("rejected")
    expect(file.reject_reason).toBe("infected")
  })

  test("waiting for the verification ends at the timeout with the file as it is", async () => {
    server.use(
      http.post(apiUrl("/v1/files/:id/complete"), ({ params }) =>
        HttpResponse.json({ ...filePdf, id: String(params.id), status: "processing" }),
      ),
      http.get(apiUrl("/v1/files/:id"), ({ params }) =>
        HttpResponse.json({ ...filePdf, id: String(params.id), status: "processing" }),
      ),
    )
    const file = await uploadFile(textFile("hello"), "link", undefined, { pollIntervalMs: 5, verifyTimeoutMs: 40 })

    expect(file.status).toBe("processing")
  })

  test("a storage rejection is a files/upload-failed error with the HTTP status", async () => {
    server.use(http.put(`${TEST_STORAGE_URL}/uploads/:id`, () => new HttpResponse(null, { status: 403 })))
    const failure = await uploadFile(textFile("hello"), "link").catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ApiError)
    expect((failure as ApiError).type).toBe("files/upload-failed")
    expect((failure as ApiError).status).toBe(403)
  })

  test("surfaces files/type-not-allowed from POST /v1/files", async () => {
    const failure = await uploadFile(textFile("MZ", "setup.exe", "application/octet-stream"), "link").catch(
      (error: unknown) => error,
    )
    expect((failure as ApiError).type).toBe("files/type-not-allowed")
    expect((failure as ApiError).status).toBe(415)
  })

  test("surfaces files/quota-exceeded from POST /v1/files", async () => {
    server.use(errorHandlers.filesQuotaExceeded)
    const failure = await uploadFile(textFile("x"), "ai_upload").catch((error: unknown) => error)
    expect((failure as ApiError).type).toBe("files/quota-exceeded")
  })

  test("a network failure of the storage is a network error", async () => {
    server.use(http.put(`${TEST_STORAGE_URL}/uploads/:id`, () => HttpResponse.error()))
    const failure = await uploadFile(textFile("x"), "link").catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ApiError)
    expect((failure as ApiError).type).toBe("network/unreachable")
  })
})
