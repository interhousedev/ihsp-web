import { HttpResponse, http } from "msw"
import { groupProgressFor } from "../fixtures/group-progress"
import { apiUrl, problem, query } from "./utils"

function progress(request: Request): Response {
  const raw = query(request).get("semester")
  return HttpResponse.json(groupProgressFor(raw === null ? 1 : Number(raw)))
}

/** Marks and attendance of a group, for its curator and its head student. */
export const groupProgressHandlers = [
  http.get(apiUrl("/v1/staff/groups/:id/progress"), ({ request }) => progress(request)),
  http.get(apiUrl("/v1/me/group/progress"), ({ request }) => progress(request)),
]

/** The response a non-head student gets from `GET /v1/me/group/progress`. */
export function notHeadStudentResponse(): Response {
  return problem(403, "academic/not-head-student", "Only the head student can see the group progress")
}
