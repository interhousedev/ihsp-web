// Public client configuration: which optional features are on and where the documentation lives.

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
