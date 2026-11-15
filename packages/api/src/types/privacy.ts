// Privacy: the caller's data exports, account erasure requests and the admin review queue (tag `privacy`).

export type ExportStatus = "queued" | "running" | "ready" | "failed"
export type ErasureStatus = "pending_review" | "approved" | "rejected" | "completed" | "cancelled"

export type DataExport = {
  id: string
  status: ExportStatus
  created_at: string
  finished_at: string | null
  expires_at: string | null
  byte_size: number | null
}
/** Body of the export request: the code sent by `POST /v1/id/me/step-up`. */
export type DataExportBody = { otp_code: string }
export type DataExportList = { items: DataExport[] }
/** A presigned URL valid for `expires_in` seconds. */
export type DataExportDownload = { url: string; expires_in?: number }

export type ErasureRequest = {
  id: string
  status: ErasureStatus
  requested_at: string
  decided_at: string | null
  reject_reason: string | null
  closes_on: string | null
}
export type MyErasure = { request: ErasureRequest | null }

export type AdminErasureRequest = ErasureRequest & {
  user_id: string
  login: string | null
  name: string | null
  roles: string[]
}
export type AdminErasureList = { items: AdminErasureRequest[] }
export type AdminErasureParams = { status?: ErasureStatus; limit?: number; offset?: number }
export type RejectErasureBody = { reason?: string | null }
