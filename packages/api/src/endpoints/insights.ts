// Admin insights endpoint.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { Insights } from "../types/insights"

/** GET /v1/admin/insights — admin. */
export function getAdminInsights(opts?: RequestOptions): Promise<Insights> {
  return api.get<Insights>("/v1/admin/insights", opts)
}
export const getAdminInsightsQuery = () =>
  queryOptions({ queryKey: keys.admin.insights(), queryFn: ({ signal }) => getAdminInsights({ signal }) })
