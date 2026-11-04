// "My group" for every student: the group card, homeroom teacher, head student and members.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { MyGroup } from "../types/my-group"

/** GET /v1/me/group — any student of the group. */
export function getMyGroup(opts?: RequestOptions): Promise<MyGroup> {
  return api.get<MyGroup>("/v1/me/group", opts)
}
export const getMyGroupQuery = () =>
  queryOptions({ queryKey: keys.me.group(), queryFn: ({ signal }) => getMyGroup({ signal }) })
