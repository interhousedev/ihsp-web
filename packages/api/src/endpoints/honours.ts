// Honours and the EMIS rating book — student.

import { api } from "../client"
import { queryOptions, type RequestOptions } from "../query"
import type { EmisRatingBook, Honours } from "../types/honours"

/** GET /v1/me/honours — red diploma, gold and silver medal eligibility with the marks that block. */
export function getMeHonours(opts?: RequestOptions): Promise<Honours> {
  return api.get<Honours>("/v1/me/honours", opts)
}
export const getMeHonoursQuery = () =>
  queryOptions({
    queryKey: ["me", "honours"] as const,
    queryFn: ({ signal }) => getMeHonours({ signal }),
  })

/** GET /v1/me/emis/rating-book — a short-lived link to the rating book PDF. */
export function getMeEmisRatingBook(opts?: RequestOptions): Promise<EmisRatingBook> {
  return api.get<EmisRatingBook>("/v1/me/emis/rating-book", opts)
}
