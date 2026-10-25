// Admin work-off statistics (`/v1/admin/work-offs`).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { AdminWorkOffList, AdminWorkOffsParams, WorkOffStats, WorkOffStatsParams } from "../types/work-offs-admin"

/** GET /v1/admin/work-offs/stats — admin; open and done counts per subject, teacher, group or student. */
export function getAdminWorkOffStats(params?: WorkOffStatsParams, opts?: RequestOptions): Promise<WorkOffStats> {
  return api.get<WorkOffStats>("/v1/admin/work-offs/stats", { ...opts, query: params })
}
export const getAdminWorkOffStatsQuery = (params?: WorkOffStatsParams) =>
  queryOptions({
    queryKey: keys.admin.workOffs.stats(params),
    queryFn: ({ signal }) => getAdminWorkOffStats(params, { signal }),
  })

/** GET /v1/admin/work-offs — admin; one page of work-offs filtered by subject, teacher, group, student and status. */
export function getAdminWorkOffs(params?: AdminWorkOffsParams, opts?: RequestOptions): Promise<AdminWorkOffList> {
  return api.get<AdminWorkOffList>("/v1/admin/work-offs", { ...opts, query: params })
}
export const getAdminWorkOffsQuery = (params?: AdminWorkOffsParams) =>
  queryOptions({
    queryKey: keys.admin.workOffs.list(params),
    queryFn: ({ signal }) => getAdminWorkOffs(params, { signal }),
  })
