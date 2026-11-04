import { HttpResponse, http } from "msw"
import { groupRatingRows } from "../fixtures/group-rating"
import { apiUrl, problem } from "./utils"

/** The group rating is open to the head student only: anyone else gets 403 (as group progress). */
export const groupRatingHandlers = [http.get(apiUrl("/v1/me/group/rating"), () => HttpResponse.json(groupRatingRows))]

/** Answer for a student who is not the head of the group. */
export function groupRatingForbidden(): Response {
  return problem(403, "common/forbidden", "Forbidden")
}
