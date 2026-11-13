// The signed-in student's card and the short-lived QR tokens that open its public view.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { StudentCard, StudentCardToken } from "../types/student-card"

/** GET /v1/me/student-card — student. */
export function getMeStudentCard(opts?: RequestOptions): Promise<StudentCard> {
  return api.get<StudentCard>("/v1/me/student-card", opts)
}
export const getMeStudentCardQuery = () =>
  queryOptions({ queryKey: keys.me.studentCard(), queryFn: ({ signal }) => getMeStudentCard({ signal }) })

/** POST /v1/me/student-card/tokens — student; issues a new token on every call. */
export function postMeStudentCardToken(opts?: RequestOptions): Promise<StudentCardToken> {
  return api.post<StudentCardToken>("/v1/me/student-card/tokens", undefined, opts)
}
