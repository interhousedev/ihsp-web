// Public — the maintenance state every app shell shows as a banner.

import type { components } from "../generated/openapi"
import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"

export type Maintenance = components["schemas"]["MaintenanceResponse"]

/** GET /v1/public/maintenance — none, never cached. */
export function getPublicMaintenance(opts?: RequestOptions): Promise<Maintenance> {
  return api.get<Maintenance>("/v1/public/maintenance", { ...opts, auth: "none" })
}
export const getPublicMaintenanceQuery = () =>
  queryOptions({
    queryKey: keys.public.maintenance(),
    queryFn: ({ signal }) => getPublicMaintenance({ signal }),
  })
