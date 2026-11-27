import { api, queryOptions, type RequestOptions, type TimetableRangeParams } from "@ihsp/api"

/** A non-lesson part of the school day: lunch, a break, an assembly. */
export type DayBlockKind = "lunch" | "second_lunch" | "break" | "assembly" | "other"

export type DayBlockItem = {
  id: string
  date: string
  name: string
  kind: DayBlockKind
  starts_at: string
  ends_at: string
}

/** GET /v1/me/timetable/day-blocks?from&to — student. */
export function getMeDayBlocks(params: TimetableRangeParams, opts?: RequestOptions): Promise<DayBlockItem[]> {
  return api.get<DayBlockItem[]>("/v1/me/timetable/day-blocks", { ...opts, query: params })
}

export const getMeDayBlocksQuery = (params: TimetableRangeParams) =>
  queryOptions({
    queryKey: ["me", "timetable", "day-blocks", params.from ?? null, params.to ?? null],
    queryFn: ({ signal }) => getMeDayBlocks(params, { signal }),
  })
