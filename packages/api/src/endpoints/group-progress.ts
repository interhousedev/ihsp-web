// TODO(contract): hand-written until the OpenAPI document has the group progress routes.

import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { GroupProgress } from "../types/group-progress"

/** GET /v1/staff/groups/{id}/progress?semester — the group's curator or an administrator; `403` otherwise. */
export function getGroupProgress(groupId: string, semester?: number, opts?: RequestOptions): Promise<GroupProgress> {
  return api.get<GroupProgress>(`/v1/staff/groups/${seg(groupId)}/progress`, {
    ...opts,
    query: semester === undefined ? undefined : { semester },
  })
}
export const getGroupProgressQuery = (groupId: string, semester?: number) =>
  queryOptions({
    queryKey: ["staff", "groups", groupId, "progress", semester ?? null] as const,
    queryFn: ({ signal }) => getGroupProgress(groupId, semester, { signal }),
  })

/** GET /v1/me/group/progress?semester — the group's head student only; `403` with `academic/not-head-student` otherwise. */
export function getMyGroupProgress(semester?: number, opts?: RequestOptions): Promise<GroupProgress> {
  return api.get<GroupProgress>("/v1/me/group/progress", {
    ...opts,
    query: semester === undefined ? undefined : { semester },
  })
}
export const getMyGroupProgressQuery = (semester?: number) =>
  queryOptions({
    queryKey: ["me", "group", "progress", semester ?? null] as const,
    queryFn: ({ signal }) => getMyGroupProgress(semester, { signal }),
  })
