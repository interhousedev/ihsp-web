// LMS — course settings (Canvas-style), link check and the learner landing page.

import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"

// TODO(contract): replace with generated types once the backend publishes the routes.
export type CourseLanguage = "uz" | "ru" | "en"
export type CourseLevel = "beginner" | "intermediate" | "advanced"
export type AudienceScope = "link" | "group" | "lyceum" | "public"
export type CoursePublishState = "draft" | "published" | "archived"

export const COURSE_NAV_KEYS = [
  "overview",
  "syllabus",
  "announcements",
  "people",
  "grades",
  "files",
  "notebooks",
  "discussions",
] as const
export type CourseNavKey = (typeof COURSE_NAV_KEYS)[number]
export type CourseNavItem = { key: CourseNavKey; hidden: boolean }

export type CourseSettingsView = {
  id: string
  slug: string
  lock_version: number
  code: string | null
  friendly_name: string | null
  summary: string | null
  cover_file_id: string | null
  banner_file_id: string | null
  accent_color: string | null
  language: CourseLanguage
  level: CourseLevel | null
  workload_hours_per_week: number | null
  duration_weeks: number | null
  tags: string[]
  outcomes: string[]
  requirements: string[]
  audience: string[]
  audience_scope: AudienceScope
  audience_group_ids: string[]
  enrolment_open: boolean
  enrolment_starts_at: string | null
  enrolment_ends_at: string | null
  navigation: CourseNavItem[]
  publish_state: CoursePublishState
  visibility: "public" | "invite"
  invite_code: string | null
  stats: { sections: number; steps: number; learners: number; staff_by_role: Record<string, number> }
}

/** The writable fields of `PATCH .../settings/details`; `null` clears a nullable field. */
export type CourseDetailsBody = Partial<
  Pick<
    CourseSettingsView,
    | "code"
    | "friendly_name"
    | "summary"
    | "cover_file_id"
    | "banner_file_id"
    | "accent_color"
    | "language"
    | "level"
    | "workload_hours_per_week"
    | "duration_weeks"
    | "tags"
    | "outcomes"
    | "requirements"
    | "audience"
    | "audience_scope"
    | "audience_group_ids"
    | "enrolment_open"
    | "enrolment_starts_at"
    | "enrolment_ends_at"
    | "navigation"
  >
>

export type LinkCheckResult = {
  url: string
  step_id: string
  step_title: string
  status_code: number | null
  ok: boolean
  error: "forbidden-target" | "timeout" | "unreachable" | "too-many-redirects" | null
}

export type LinkCheckState = {
  status: "idle" | "running" | "done"
  job_id: string | null
  checked_at: string | null
  results: LinkCheckResult[]
}

export type CourseLanding = {
  id: string
  slug: string
  title: string
  friendly_name: string | null
  summary: string | null
  description: string
  cover_file_id: string | null
  cover_url: string | null
  banner_file_id: string | null
  banner_url: string | null
  accent_color: string | null
  language: CourseLanguage
  level: CourseLevel | null
  workload_hours_per_week: number | null
  duration_weeks: number | null
  tags: string[]
  outcomes: string[]
  requirements: string[]
  audience: string[]
  publish_state: CoursePublishState
  preview: boolean
  authors: { user: { id: string; first_name: string; last_name: string }; role: string }[]
  syllabus: { title: string; steps: { title: string }[] }[]
  enrolment: { open: boolean; starts_at: string | null; ends_at: string | null; can_enrol: boolean; enrolled: boolean }
}

export const lmsSettingsKey = (courseId: string) => ["lms", "course", courseId, "settings"] as const
export const lmsLinkCheckKey = (courseId: string) => ["lms", "course", courseId, "link-check"] as const
export const lmsLandingKey = (slug: string, preview: boolean) => ["lms", "course", slug, "landing", preview] as const

/** GET /v1/lms/courses/{id}/settings — course:edit. */
export function getLmsCourseSettings(courseId: string, opts?: RequestOptions): Promise<CourseSettingsView> {
  return api.get<CourseSettingsView>(`/v1/lms/courses/${seg(courseId)}/settings`, opts)
}
export const getLmsCourseSettingsQuery = (courseId: string) =>
  queryOptions({
    queryKey: lmsSettingsKey(courseId),
    queryFn: ({ signal }) => getLmsCourseSettings(courseId, { signal }),
  })

/** PATCH /v1/lms/courses/{id}/settings/details — course:edit; `422 lms/settings-invalid` with `params.field`. */
export function patchLmsCourseDetails(
  courseId: string,
  body: CourseDetailsBody,
  opts?: RequestOptions,
): Promise<CourseSettingsView> {
  return api.patch<CourseSettingsView>(`/v1/lms/courses/${seg(courseId)}/settings/details`, body, opts)
}

/** POST /v1/lms/courses/{id}/settings/join-code — rotates the join code. */
export function postLmsCourseJoinCode(courseId: string, opts?: RequestOptions): Promise<{ invite_code: string }> {
  return api.post<{ invite_code: string }>(`/v1/lms/courses/${seg(courseId)}/settings/join-code`, undefined, opts)
}

/** POST /v1/lms/courses/{id}/link-check — starts the check of every link of the course. */
export function postLmsCourseLinkCheck(courseId: string, opts?: RequestOptions): Promise<{ job_id: string }> {
  return api.post<{ job_id: string }>(`/v1/lms/courses/${seg(courseId)}/link-check`, undefined, opts)
}

/** GET /v1/lms/courses/{id}/link-check. */
export function getLmsCourseLinkCheck(courseId: string, opts?: RequestOptions): Promise<LinkCheckState> {
  return api.get<LinkCheckState>(`/v1/lms/courses/${seg(courseId)}/link-check`, opts)
}
export const getLmsCourseLinkCheckQuery = (courseId: string) =>
  queryOptions({
    queryKey: lmsLinkCheckKey(courseId),
    queryFn: ({ signal }) => getLmsCourseLinkCheck(courseId, { signal }),
  })

/** GET /v1/lms/courses/{slug}/landing[?preview=1] — the learner landing page. */
export function getLmsCourseLanding(slug: string, preview = false, opts?: RequestOptions): Promise<CourseLanding> {
  return api.get<CourseLanding>(`/v1/lms/courses/${seg(slug)}/landing`, {
    ...opts,
    query: preview ? { preview: 1 } : undefined,
  })
}
export const getLmsCourseLandingQuery = (slug: string, preview = false) =>
  queryOptions({
    queryKey: lmsLandingKey(slug, preview),
    queryFn: ({ signal }) => getLmsCourseLanding(slug, preview, { signal }),
  })
