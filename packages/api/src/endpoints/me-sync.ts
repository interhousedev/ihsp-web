// Academic — the student's own initial EMIS sync (sync with proof) and the admin list of them.

import type { components } from "../generated/openapi"
import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"

/** The durable sync record: status, attempts, last error, what was synced. */
export type MeSyncStatus = components["schemas"]["SyncStatusResponse"]
export type StudentSyncStatus = MeSyncStatus["status"]

/** GET /v1/me/sync — student; `null` before the first sync. */
export function getMeSync(opts?: RequestOptions): Promise<MeSyncStatus | null> {
  return api.get<MeSyncStatus | null>("/v1/me/sync", opts)
}
export const getMeSyncQuery = () =>
  queryOptions({
    queryKey: keys.me.sync(),
    queryFn: ({ signal }) => getMeSync({ signal }),
  })

/** POST /v1/me/sync — student; 202 with the job. Idempotent: a pending, running or done job is returned as it is. */
export function postMeSync(opts?: RequestOptions): Promise<MeSyncStatus> {
  return api.post<MeSyncStatus>("/v1/me/sync", {}, opts)
}

/** GET /v1/admin/students/{user_id}/sync — admin; the student's last full EMIS sync, `null` when none. */
export function getAdminStudentSync(userId: string, opts?: RequestOptions): Promise<MeSyncStatus | null> {
  return api.get<MeSyncStatus | null>(`/v1/admin/students/${encodeURIComponent(userId)}/sync`, opts)
}
export const getAdminStudentSyncQuery = (userId: string) =>
  queryOptions({
    queryKey: keys.admin.studentSync(userId),
    queryFn: ({ signal }) => getAdminStudentSync(userId, { signal }),
  })

/** POST /v1/admin/students/{user_id}/sync — admin; 202 with the job. Idempotent: a pending or running job is returned as it is. */
export function postAdminStudentSync(userId: string, opts?: RequestOptions): Promise<MeSyncStatus> {
  return api.post<MeSyncStatus>(`/v1/admin/students/${encodeURIComponent(userId)}/sync`, {}, opts)
}

/** GET /v1/admin/sync/student-syncs?status= — admin; the students whose initial sync is in one status. */
export function getAdminStudentSyncs(
  status: StudentSyncStatus = "failed",
  opts?: RequestOptions,
): Promise<MeSyncStatus[]> {
  return api.get<MeSyncStatus[]>("/v1/admin/sync/student-syncs", { ...opts, query: { status } })
}
export const getAdminStudentSyncsQuery = (status: StudentSyncStatus = "failed") =>
  queryOptions({
    queryKey: keys.admin.studentSyncs(status),
    queryFn: ({ signal }) => getAdminStudentSyncs(status, { signal }),
  })
