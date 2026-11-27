// Non-lesson blocks (lunch, second lunch, break, assembly): hand-typed from
// app/interfaces/http/v1/admin_schedule/day_blocks/schemas.py until the openapi sync.

import { api, queryOptions, seg } from "@ihsp/api"

export const DAY_BLOCK_KINDS = ["lunch", "second_lunch", "break", "assembly", "other"] as const
export type DayBlockKind = (typeof DAY_BLOCK_KINDS)[number]
export const DAY_BLOCK_SCOPES = ["all", "course", "groups"] as const
export type DayBlockScope = (typeof DAY_BLOCK_SCOPES)[number]

export type DayBlockBody = {
  name: string
  kind: DayBlockKind
  /** "HH:MM" or "HH:MM:SS". */
  starts_at: string
  ends_at: string
  /** ISO weekdays, Monday 1 … Friday 5. */
  weekdays: number[]
  scope: DayBlockScope
  course: number | null
  group_ids: string[]
}

export type DayBlock = DayBlockBody & { id: string }

export const dayBlocksKey = ["admin", "day-blocks"] as const

export const getAdminDayBlocksQuery = () =>
  queryOptions({
    queryKey: dayBlocksKey,
    queryFn: ({ signal }) => api.get<DayBlock[]>("/v1/admin/day-blocks", { signal }),
  })

export function postAdminDayBlock(body: DayBlockBody): Promise<DayBlock> {
  return api.post<DayBlock>("/v1/admin/day-blocks", body)
}

export function putAdminDayBlock(id: string, body: DayBlockBody): Promise<DayBlock> {
  return api.put<DayBlock>(`/v1/admin/day-blocks/${seg(id)}`, body)
}

export function deleteAdminDayBlock(id: string): Promise<unknown> {
  return api.delete(`/v1/admin/day-blocks/${seg(id)}`)
}
