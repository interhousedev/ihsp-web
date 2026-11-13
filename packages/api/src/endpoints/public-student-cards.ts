// Public student card behind a QR token (anonymous).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { PublicStudentCard } from "../types/public-student-cards"

/** GET /v1/public/student-cards/{token} — none; `404` unknown or expired token. */
export function getPublicStudentCard(token: string, opts?: RequestOptions): Promise<PublicStudentCard> {
  return api.get<PublicStudentCard>(`/v1/public/student-cards/${seg(token)}`, { ...opts, auth: "none" })
}
export const getPublicStudentCardQuery = (token: string) =>
  queryOptions({
    queryKey: keys.public.studentCard(token),
    queryFn: ({ signal }) => getPublicStudentCard(token, { signal }),
  })

/** Path of GET /v1/public/student-cards/{token}/photo (an image; never cached), to use as an `<img src>` after the API origin. */
export const publicStudentCardPhotoPath = (token: string) => `/v1/public/student-cards/${seg(token)}/photo`
