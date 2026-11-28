// Overall student rating of the academic year — student (GET /v1/me/rating).

import { api } from "../client"
import { queryOptions, type RequestOptions } from "../query"
import type { OverallRating } from "../types/rating"

/** GET /v1/me/rating — the lyceum's students ranked by the overall score of the year. */
export function getMyOverallRating(limit?: number, opts?: RequestOptions): Promise<OverallRating> {
  return api.get<OverallRating>("/v1/me/rating", { ...opts, query: limit === undefined ? undefined : { limit } })
}
export const getMyOverallRatingQuery = (limit = 50) =>
  queryOptions({
    queryKey: ["me", "rating", limit] as const,
    queryFn: ({ signal }) => getMyOverallRating(limit, { signal }),
  })
