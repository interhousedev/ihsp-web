import { HttpResponse, http } from "msw"
import { groupRatingRows } from "../fixtures/group-rating"
import { apiUrl, problem } from "./utils"

/** The group rating is open to the head student only: anyone else gets 403 (as group progress). */
export const groupRatingHandlers = [
  http.get(apiUrl("/v1/me/group/rating"), () => HttpResponse.json(groupRatingRows)),
  // The lyceum rating: an empty year by default; tests override it with their own rows.
  http.get(apiUrl("/v1/me/rating"), () =>
    HttpResponse.json({
      academic_year: { label: "2026/2027", starts_on: "2026-09-01", ends_on: "2027-06-30" },
      weights: {
        base: 100,
        category_points: {},
        level_points: {},
        marks_threshold: 3,
        marks_points: 20,
        absence_points: 1,
        work_off_points: 2,
      },
      total: 0,
      top: [],
      me: null,
    }),
  ),
]

/** Answer for a student who is not the head of the group. */
export function groupRatingForbidden(): Response {
  return problem(403, "common/forbidden", "Forbidden")
}
