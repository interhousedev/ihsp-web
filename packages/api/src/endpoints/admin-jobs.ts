// Admin — worker processes (EMIS pulls, material re-syncs): the list and stopping one.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"

// TODO(contract): replace with generated
/** One worker job; `done`/`total` and `counters` are its progress. */
export interface AdminJob {
  id: string
  kind: string
  label: string
  status: "queued" | "running" | "stopping" | "done" | "failed" | "cancelled"
  created_at: string
  started_at: string | null
  finished_at: string | null
  started_by: string | null
  done: number
  total: number | null
  note: string | null
  counters: Record<string, number>
}

// TODO(contract): replace with generated
export interface AdminJobList {
  items: AdminJob[]
}

/** GET /v1/admin/jobs — admin; active jobs first, then those finished in the last day. */
export function getAdminJobs(opts?: RequestOptions): Promise<AdminJobList> {
  return api.get<AdminJobList>("/v1/admin/jobs", opts)
}
export const getAdminJobsQuery = () =>
  queryOptions({ queryKey: keys.admin.jobs(), queryFn: ({ signal }) => getAdminJobs({ signal }) })

/** POST /v1/admin/jobs/{id}/cancel — admin; a queued job is dropped, a running one stops at its next check. */
export function postAdminJobCancel(id: string, opts?: RequestOptions): Promise<AdminJob> {
  return api.post<AdminJob>(`/v1/admin/jobs/${encodeURIComponent(id)}/cancel`, {}, opts)
}
