// Dashboard widgets (student home screen).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { Dashboard, DashboardSaveBody } from "../types/dashboard"

/** GET /v1/me/dashboard — the saved layout, or the default one at version 0. */
export function getMeDashboard(opts?: RequestOptions): Promise<Dashboard> {
  return api.get<Dashboard>("/v1/me/dashboard", opts)
}
export const getMeDashboardQuery = () =>
  queryOptions({
    queryKey: keys.dashboard.layout(),
    queryFn: ({ signal }) => getMeDashboard({ signal }),
  })

/** PUT /v1/me/dashboard — replaces the layout; 409 when `version` is not the stored one. */
export function putMeDashboard(body: DashboardSaveBody, opts?: RequestOptions): Promise<Dashboard> {
  return api.put<Dashboard>("/v1/me/dashboard", body, opts)
}
