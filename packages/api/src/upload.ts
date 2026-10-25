import { getFile, getFileUrl, postFileComplete, postFiles } from "./endpoints/files"
import { ApiError, networkError } from "./errors"
import type { FileItem, FileUploadPurpose, FileUploadTarget } from "./types/files"

/** Receives the share of bytes sent, from 0 to 1. */
export type UploadProgress = (fraction: number) => void

export type UploadOptions = {
  signal?: AbortSignal
  /** Wait between two checks of a file that is still being verified (default 700 ms; tests use a few). */
  pollIntervalMs?: number
  /** Give up waiting for the verification after this long and return the file as it is (default 60 s). */
  verifyTimeoutMs?: number
}

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** SHA-256 of the file as standard base64 (`sha256_b64` of `POST /v1/files`). */
export async function sha256Base64(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return toBase64(new Uint8Array(digest))
}

function uploadFailed(status: number): ApiError {
  return new ApiError({
    type: "files/upload-failed",
    status,
    title: `Storage rejected the upload (HTTP ${status})`,
  })
}

/** `PUT` to the presigned URL with exactly the headers the backend returned; XHR gives upload progress. */
function putToStorage(
  target: FileUploadTarget,
  file: File,
  onProgress: UploadProgress | undefined,
  signal: AbortSignal | undefined,
): Promise<void> {
  if (typeof XMLHttpRequest === "undefined") {
    return fetch(target.url, { method: target.method, headers: target.headers, body: file, signal })
      .then((response) => {
        if (!response.ok) throw uploadFailed(response.status)
        onProgress?.(1)
      })
      .catch((cause: unknown) => {
        throw cause instanceof ApiError ? cause : networkError(cause)
      })
  }
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(target.method, target.url)
    for (const [name, value] of Object.entries(target.headers)) xhr.setRequestHeader(name, value)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1)
        resolve()
      } else {
        reject(uploadFailed(xhr.status))
      }
    }
    xhr.onerror = () => reject(networkError(new Error("Upload failed")))
    xhr.onabort = () => reject(new DOMException("Upload aborted", "AbortError"))
    signal?.addEventListener("abort", () => xhr.abort(), { once: true })
    xhr.send(file)
  })
}

function sleep(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer)
        reject(new DOMException("Upload aborted", "AbortError"))
      },
      { once: true },
    )
  })
}

/**
 * `POST /v1/files/{id}/complete` only checks the object and queues the verification (`status: "processing"`); a worker
 * then scans it and extracts text. Polls `GET /v1/files/{id}` until the file is `ready` or `rejected`.
 */
async function waitUntilVerified(file: FileItem, options: UploadOptions | undefined): Promise<FileItem> {
  const interval = options?.pollIntervalMs ?? 700
  const deadline = Date.now() + (options?.verifyTimeoutMs ?? 60_000)
  let current = file
  while ((current.status === "pending" || current.status === "processing") && Date.now() < deadline) {
    await sleep(interval, options?.signal)
    current = await getFile(current.id, { signal: options?.signal })
  }
  return current
}

/**
 * Presigned upload flow: SHA-256 of the file, `POST /v1/files`, `PUT` to the returned URL with the returned headers
 * (XMLHttpRequest, for progress), `POST /v1/files/{id}/complete`, then waiting for the verification. Returns the file
 * as the backend verified it (`status: "ready"`, or `"rejected"` with `reject_reason`).
 */
export async function uploadFile(
  file: File,
  purpose: FileUploadPurpose,
  onProgress?: UploadProgress,
  options?: UploadOptions,
): Promise<FileItem> {
  const sha256_b64 = await sha256Base64(file)
  const { file: created, upload } = await postFiles(
    {
      name: file.name,
      size: file.size,
      content_type: file.type || "application/octet-stream",
      sha256_b64,
      purpose,
    },
    options,
  )
  await putToStorage(upload, file, onProgress, options?.signal)
  const completed = await postFileComplete(created.id, { signal: options?.signal })
  return waitUntilVerified(completed, options)
}

/** Presigned download or inline URL for `<img>`/links (valid for 60 seconds). */
export async function resolveFileUrl(fileId: string, inline = false): Promise<string> {
  const { url } = await getFileUrl(fileId, { disposition: inline ? "inline" : "attachment" })
  return url
}
