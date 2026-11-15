// Public client configuration: which optional features are on and where the documentation lives.

import { getConfig } from "@ihsp/config"
import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { ClientConfig } from "../types/client-config"

/** GET /v1/public/client-config — none. */
export function getClientConfig(opts?: RequestOptions): Promise<ClientConfig> {
  return api.get<ClientConfig>("/v1/public/client-config", { ...opts, auth: "none" })
}
/** Changes rarely: cached for ten minutes. */
export const clientConfigQuery = () =>
  queryOptions({
    queryKey: keys.public.clientConfig(),
    queryFn: ({ signal }) => getClientConfig({ signal }),
    staleTime: 10 * 60 * 1000,
  })

/** Makes an API-relative link (`/v1/public/lyceum-logo?v=…`) absolute against the API base URL. */
export function apiAbsoluteUrl(path: string): string {
  return `${getConfig().API_URL.replace(/\/+$/, "")}${path}`
}
