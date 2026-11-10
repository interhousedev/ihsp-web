// The map of app pages the caller may open.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { AppMapResponse } from "../types/app-map"

/** GET /v1/app-map — bearer; the pages of every app that the caller's roles may open. */
export function getAppMap(opts?: RequestOptions): Promise<AppMapResponse> {
  return api.get<AppMapResponse>("/v1/app-map", opts)
}
export const getAppMapQuery = () =>
  queryOptions({
    queryKey: keys.appMap(),
    queryFn: ({ signal }) => getAppMap({ signal }),
  })
