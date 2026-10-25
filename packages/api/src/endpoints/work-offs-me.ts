// Academic — the student's work-off tasks.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { MyWorkOff, MyWorkOffsParams } from "../types/work-offs-me"

/** GET /v1/me/work-offs?status=open|all — student; newest lesson first. */
export function getMeWorkOffs(params?: MyWorkOffsParams, opts?: RequestOptions): Promise<MyWorkOff[]> {
  return api.get<MyWorkOff[]>("/v1/me/work-offs", { ...opts, query: params })
}
export const getMeWorkOffsQuery = (params?: MyWorkOffsParams) =>
  queryOptions({
    queryKey: keys.me.workOffs(params),
    queryFn: ({ signal }) => getMeWorkOffs(params, { signal }),
  })
