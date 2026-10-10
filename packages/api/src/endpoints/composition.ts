// Composition endpoints: alerts, search, calendar feed, admin dashboard and 360 views.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  AdminDashboard,
  Alert,
  OutboundMailSent,
  CalendarTokenResponse,
  GroupStat,
  SearchParams,
  SearchResults,
  SendOutboundMailBody,
  Student360,
  TeacherProfile,
} from "../types/composition"

/** GET /v1/me/alerts — student. */
export function getMeAlerts(opts?: RequestOptions): Promise<Alert[]> {
  return api.get<Alert[]>("/v1/me/alerts", opts)
}
export const getMeAlertsQuery = () =>
  queryOptions({ queryKey: keys.me.alerts(), queryFn: ({ signal }) => getMeAlerts({ signal }) })

/** GET /v1/me/search?q — bearer. */
export function getMeSearch(params: SearchParams, opts?: RequestOptions): Promise<SearchResults> {
  return api.get<SearchResults>("/v1/me/search", { ...opts, query: params })
}
export const getMeSearchQuery = (params: SearchParams) =>
  queryOptions({
    queryKey: keys.me.search(params.q),
    queryFn: ({ signal }) => getMeSearch(params, { signal }),
  })

/** POST /v1/me/outbound-mail — bearer; one email to anyone, optionally with a file from My files. */
export function postMeOutboundMail(body: SendOutboundMailBody, opts?: RequestOptions): Promise<OutboundMailSent> {
  return api.post<OutboundMailSent>("/v1/me/outbound-mail", body, opts)
}

/** POST /v1/me/calendar-token — student; the URL is shown once and the token rotates. */
export function postMeCalendarToken(opts?: RequestOptions): Promise<CalendarTokenResponse> {
  return api.post<CalendarTokenResponse>("/v1/me/calendar-token", undefined, opts)
}

/** GET /ical/{token}.ics — none; `text/calendar` as text. */
export function getIcal(token: string, opts?: RequestOptions): Promise<string> {
  return api.get<string>(`/ical/${seg(token)}.ics`, { ...opts, auth: "none", responseType: "text" })
}

/** GET /v1/admin/dashboard — admin. */
export function getAdminDashboard(opts?: RequestOptions): Promise<AdminDashboard> {
  return api.get<AdminDashboard>("/v1/admin/dashboard", opts)
}
export const getAdminDashboardQuery = () =>
  queryOptions({ queryKey: keys.admin.dashboard(), queryFn: ({ signal }) => getAdminDashboard({ signal }) })

/** GET /v1/admin/groups/stats — admin. */
export function getAdminGroupsStats(opts?: RequestOptions): Promise<GroupStat[]> {
  return api.get<GroupStat[]>("/v1/admin/groups/stats", opts)
}
export const getAdminGroupsStatsQuery = () =>
  queryOptions({ queryKey: keys.admin.groups.stats(), queryFn: ({ signal }) => getAdminGroupsStats({ signal }) })

/** GET /v1/admin/students/{user_id} — admin; Student 360. */
export function getAdminStudent(userId: string, opts?: RequestOptions): Promise<Student360> {
  return api.get<Student360>(`/v1/admin/students/${seg(userId)}`, opts)
}
export const getAdminStudentQuery = (userId: string) =>
  queryOptions({
    queryKey: keys.admin.students.detail(userId),
    queryFn: ({ signal }) => getAdminStudent(userId, { signal }),
  })

/** GET /v1/admin/teachers/{user_id}/profile — admin. */
export function getAdminTeacherProfile(userId: string, opts?: RequestOptions): Promise<TeacherProfile> {
  return api.get<TeacherProfile>(`/v1/admin/teachers/${seg(userId)}/profile`, opts)
}
export const getAdminTeacherProfileQuery = (userId: string) =>
  queryOptions({
    queryKey: keys.admin.teachers.profile(userId),
    queryFn: ({ signal }) => getAdminTeacherProfile(userId, { signal }),
  })

// --- Names used by the app plans ---

export const postCalendarToken = postMeCalendarToken
export const getStudent360 = getAdminStudent
export const getTeacherProfile = getAdminTeacherProfile
export const getGroupsStats = getAdminGroupsStats
