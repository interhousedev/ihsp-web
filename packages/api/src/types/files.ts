// Files (backend § API contract → "Files (B6)" and Schemas).

import type { PageParams } from "./common"

export type UsedBy = { kind: "link" | "lesson" | "chat"; id: string; label: string }

export type FileItem = {
  id: string
  name: string
  content_type: string
  byte_size: number
  purpose: "ai_upload" | "link" | "mail"
  status: "pending" | "processing" | "ready" | "rejected" | "deleted"
  reject_reason: string | null
  text_bytes: number | null
  assistant_ready: boolean
  created_at: string
  expires_on: string | null
  used_by: UsedBy[]
}

/** Purposes a client may upload for. */
export type FileUploadPurpose = "ai_upload" | "link"

export type FileCreateBody = {
  name: string
  size: number
  content_type: string
  sha256_b64: string
  purpose: FileUploadPurpose
}

/** Presigned upload target: `PUT` the bytes to `url` with exactly these `headers`. */
export type FileUploadTarget = { url: string; method: "PUT"; headers: Record<string, string> }
export type FileCreateResponse = { file: FileItem; upload: FileUploadTarget }

export type FileUrlParams = { disposition?: "inline" | "attachment" }
export type FileUrlResponse = { url: string; expires_at: string }

export type FileRenameBody = { name: string }
/** Where the deleted file was used. */
export type FileDeleteResponse = { used_by: UsedBy[] }

export type MyFilesParams = PageParams & { purpose?: "ai_upload" | "link" | "mail" }

export type StorageInfo = {
  used_bytes: number
  quota_bytes: number
  term_id: string | null
  expires_on: string | null
}
