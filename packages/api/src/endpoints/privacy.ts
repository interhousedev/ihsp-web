// Privacy: data exports, account erasure requests and the admin review queue.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  AdminErasureList,
  AdminErasureParams,
  DataExport,
  DataExportBody,
  DataExportDownload,
  DataExportList,
  ErasureRequest,
  MyErasure,
  RejectErasureBody,
} from "../types/privacy"

/** GET /v1/me/privacy/exports — bearer; the caller's recent exports, newest first. */
export function getMePrivacyExports(opts?: RequestOptions): Promise<DataExportList> {
  return api.get<DataExportList>("/v1/me/privacy/exports", opts)
}
export const getMePrivacyExportsQuery = () =>
  queryOptions({
    queryKey: keys.privacy.exports(),
    queryFn: ({ signal }) => getMePrivacyExports({ signal }),
  })

/** POST /v1/me/privacy/exports — bearer + step-up code; `202`, queues an export of the caller's data. */
export function postMePrivacyExport(body: DataExportBody, opts?: RequestOptions): Promise<DataExport> {
  return api.post<DataExport>("/v1/me/privacy/exports", body, opts)
}

/** GET /v1/me/privacy/exports/{export_id}/download — owner only; a presigned URL valid for 60 seconds. */
export function getMePrivacyExportDownload(exportId: string, opts?: RequestOptions): Promise<DataExportDownload> {
  return api.get<DataExportDownload>(`/v1/me/privacy/exports/${seg(exportId)}/download`, opts)
}

/** GET /v1/me/privacy/erasure — bearer; the caller's open erasure request, if any. */
export function getMePrivacyErasure(opts?: RequestOptions): Promise<MyErasure> {
  return api.get<MyErasure>("/v1/me/privacy/erasure", opts)
}
export const getMePrivacyErasureQuery = () =>
  queryOptions({
    queryKey: keys.privacy.erasure(),
    queryFn: ({ signal }) => getMePrivacyErasure({ signal }),
  })

/** DELETE /v1/me/privacy/erasure — bearer; cancels the open request. */
export function deleteMePrivacyErasure(opts?: RequestOptions): Promise<ErasureRequest> {
  return api.delete<ErasureRequest>("/v1/me/privacy/erasure", opts)
}

/** GET /v1/admin/privacy/erasure-requests?status&limit&offset — admin; the review queue. */
export function getAdminErasureRequests(params?: AdminErasureParams, opts?: RequestOptions): Promise<AdminErasureList> {
  return api.get<AdminErasureList>("/v1/admin/privacy/erasure-requests", { ...opts, query: params })
}
export const getAdminErasureRequestsQuery = (params?: AdminErasureParams) =>
  queryOptions({
    queryKey: keys.privacy.adminErasure(params),
    queryFn: ({ signal }) => getAdminErasureRequests(params, { signal }),
  })

/** POST /v1/admin/privacy/erasure-requests/{id}/approve — admin; irreversible, the account's data is erased. */
export function postAdminErasureApprove(requestId: string, opts?: RequestOptions): Promise<ErasureRequest> {
  return api.post<ErasureRequest>(`/v1/admin/privacy/erasure-requests/${seg(requestId)}/approve`, undefined, opts)
}

/** POST /v1/admin/privacy/erasure-requests/{id}/reject — admin; the reason is shown to the user. */
export function postAdminErasureReject(
  requestId: string,
  body: RejectErasureBody,
  opts?: RequestOptions,
): Promise<ErasureRequest> {
  return api.post<ErasureRequest>(`/v1/admin/privacy/erasure-requests/${seg(requestId)}/reject`, body, opts)
}
