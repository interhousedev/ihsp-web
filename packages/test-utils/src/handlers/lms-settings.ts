import type { CourseDetailsBody, CourseLanding, CourseSettingsView, LinkCheckState } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { ids } from "../fixtures/world"
import { apiUrl, notFound, param, problem, query, readJson } from "./utils"

export const courseSettingsFixture: CourseSettingsView = {
  id: ids.course,
  slug: "calculus-1",
  lock_version: 1,
  code: "MATH-101",
  friendly_name: "Calculus",
  summary: "Limits, derivatives and integrals.",
  cover_file_id: null,
  banner_file_id: null,
  accent_color: "#2563eb",
  language: "en",
  level: "beginner",
  workload_hours_per_week: 4,
  duration_weeks: 10,
  tags: ["math"],
  outcomes: ["Differentiate a function"],
  requirements: ["Algebra"],
  audience: ["Grade 11"],
  audience_scope: "public",
  audience_group_ids: [],
  enrolment_open: true,
  enrolment_starts_at: null,
  enrolment_ends_at: null,
  navigation: [
    { key: "overview", hidden: false },
    { key: "syllabus", hidden: false },
    { key: "announcements", hidden: false },
    { key: "people", hidden: false },
    { key: "grades", hidden: false },
    { key: "files", hidden: true },
    { key: "notebooks", hidden: false },
    { key: "discussions", hidden: false },
  ],
  publish_state: "published",
  visibility: "public",
  invite_code: "JOIN1234",
  stats: { sections: 2, steps: 5, learners: 12, staff_by_role: { Author: 1, Tester: 1 } },
}

export const courseLandingFixture: CourseLanding = {
  id: ids.course,
  slug: "calculus-1",
  title: "Calculus I",
  friendly_name: "Calculus",
  summary: "Limits, derivatives and integrals.",
  description: "A full first course.",
  cover_file_id: null,
  cover_url: null,
  banner_file_id: null,
  banner_url: null,
  accent_color: "#2563eb",
  language: "en",
  level: "beginner",
  workload_hours_per_week: 4,
  duration_weeks: 10,
  tags: ["math"],
  outcomes: ["Differentiate a function"],
  requirements: ["Algebra"],
  audience: ["Grade 11"],
  publish_state: "published",
  preview: false,
  authors: [{ user: { id: ids.teacherRakhimov, first_name: "Timur", last_name: "Rakhimov" }, role: "Author" }],
  syllabus: [{ title: "Limits", steps: [{ title: "What is a limit?" }, { title: "Limit laws" }] }],
  enrolment: { open: true, starts_at: null, ends_at: null, can_enrol: true, enrolled: false },
}

let settings: CourseSettingsView = structuredClone(courseSettingsFixture)
let linkCheck: LinkCheckState = { status: "idle", job_id: null, checked_at: null, results: [] }
let polls = 0

/** Back to the fixtures (call between tests). */
export function resetLmsSettings(): void {
  settings = structuredClone(courseSettingsFixture)
  linkCheck = { status: "idle", job_id: null, checked_at: null, results: [] }
  polls = 0
}

const hexOk = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value)

export const lmsSettingsHandlers = [
  http.get(apiUrl("/v1/lms/courses/:id/settings"), () => HttpResponse.json(settings)),
  http.patch(apiUrl("/v1/lms/courses/:id/settings/details"), async ({ request }) => {
    const body = await readJson<CourseDetailsBody>(request)
    if (body.accent_color && !hexOk(body.accent_color)) {
      return problem(422, "lms/settings-invalid", "Invalid settings", {
        params: { field: "accent_color", reason: "hex" },
      })
    }
    settings = { ...settings, ...body, lock_version: settings.lock_version + 1 } as CourseSettingsView
    return HttpResponse.json(settings)
  }),
  http.post(apiUrl("/v1/lms/courses/:id/settings/join-code"), () => {
    settings = { ...settings, invite_code: "NEWCODE99" }
    return HttpResponse.json({ invite_code: settings.invite_code })
  }),
  http.post(apiUrl("/v1/lms/courses/:id/link-check"), () => {
    polls = 0
    linkCheck = { status: "running", job_id: "lc-1", checked_at: null, results: [] }
    return HttpResponse.json({ job_id: "lc-1" })
  }),
  http.get(apiUrl("/v1/lms/courses/:id/link-check"), () => {
    if (linkCheck.status === "running" && ++polls >= 2) {
      linkCheck = {
        status: "done",
        job_id: "lc-1",
        checked_at: "2026-10-17T09:00:00Z",
        results: [
          {
            url: "https://ok.example/a",
            step_id: ids.courseStepText,
            step_title: "Intro",
            status_code: 200,
            ok: true,
            error: null,
          },
          {
            url: "https://dead.example/b",
            step_id: ids.courseStepTest,
            step_title: "Quiz",
            status_code: 404,
            ok: false,
            error: null,
          },
          {
            url: "https://slow.example/c",
            step_id: ids.courseStepCards,
            step_title: "Cards",
            status_code: null,
            ok: false,
            error: "timeout",
          },
        ],
      }
    }
    return HttpResponse.json(linkCheck)
  }),
  http.get(apiUrl("/v1/lms/courses/:slug/landing"), ({ params, request }) => {
    const slug = param(params, "slug")
    if (slug !== courseLandingFixture.slug && slug !== courseLandingFixture.id) return notFound("Course")
    const preview = query(request).get("preview") === "1"
    return HttpResponse.json({ ...courseLandingFixture, preview })
  }),
]
