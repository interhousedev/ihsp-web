import { HttpResponse, http } from "msw"
import {
  adminDashboard,
  alerts,
  calendarTokenResponse,
  emptySearchResults,
  groupStats,
  insights,
  searchResults,
  student360,
  teacherProfile,
} from "../fixtures/composition"
import { icalBody } from "../fixtures/public"
import { apiUrl, notFound, param, query } from "./utils"

export const compositionHandlers = [
  http.get(apiUrl("/v1/me/alerts"), () => HttpResponse.json(alerts)),
  // `?q=nothing` returns no results; any other query returns the physics results.
  http.get(apiUrl("/v1/me/search"), ({ request }) => {
    const q = query(request).get("q") ?? ""
    return HttpResponse.json(q === "nothing" || q.length === 0 ? emptySearchResults : searchResults)
  }),
  http.post(apiUrl("/v1/me/outbound-mail"), async ({ request }) => {
    const body = (await request.json()) as { to: string[] }
    return HttpResponse.json({ message_id: "<mail-1@ihsu.uz>", to: body.to, attachment_name: null })
  }),
  http.post(apiUrl("/v1/me/calendar-token"), () => HttpResponse.json(calendarTokenResponse)),
  http.get(
    apiUrl("/ical/:token.ics"),
    () => new HttpResponse(icalBody, { headers: { "Content-Type": "text/calendar; charset=utf-8" } }),
  ),
  http.get(apiUrl("/v1/admin/dashboard"), () => HttpResponse.json(adminDashboard)),
  http.get(apiUrl("/v1/admin/insights"), () => HttpResponse.json(insights)),
  http.get(apiUrl("/v1/admin/groups/stats"), () => HttpResponse.json(groupStats)),
  http.get(apiUrl("/v1/admin/students/:userId"), ({ params }) =>
    param(params, "userId") === student360.profile.user_id ? HttpResponse.json(student360) : notFound("Student"),
  ),
  http.get(apiUrl("/v1/admin/teachers/:userId/profile"), ({ params }) =>
    param(params, "userId") === teacherProfile.user.id ? HttpResponse.json(teacherProfile) : notFound("Teacher"),
  ),
]
