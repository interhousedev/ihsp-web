/**
 * Addresses of the pages of this app. Entity pages take their ids from the query string (static export); the course
 * pages keep them in the path, see `course-path.ts`.
 */

const RESERVED_SLUGS: ReadonlySet<string> = new Set(["step", "about", "shell"])

function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ""
}

export const hrefs = {
  catalog: () => "/",
  myCourses: () => "/my/",
  join: (code?: string) => `/join/${query({ code })}`,
  admin: () => "/admin/",
  /**
   * Opening a course: it resumes in the player, or shows the landing to whoever cannot learn it yet. `preview` shows it as
   * learners who are not enrolled will see it (also while a draft). A slug equal to a real folder stays in the query.
   */
  course: (slug: string, preview = false) => {
    const params = query({ preview: preview ? 1 : null })
    return RESERVED_SLUGS.has(slug)
      ? `/course/${query({ slug, preview: preview ? 1 : null })}`
      : `/course/${encodeURIComponent(slug)}/${params}`
  },
  /** `block` is the 1-based step (block) of the lesson; without it the player opens the first step not passed yet. */
  step: (courseId: string, stepId: string, block?: number) =>
    `/course/${encodeURIComponent(courseId)}/step/${encodeURIComponent(stepId)}/${query({ block })}`,
  edit: (courseId: string) => `/edit/${query({ id: courseId })}`,
  settings: (courseId: string) => `/edit/settings/${query({ id: courseId })}`,
  editStep: (stepId: string) => `/edit/step/${query({ id: stepId })}`,
  workspace: (courseId: string) => `/edit/workspace/${query({ id: courseId })}`,
  publish: (courseId: string) => `/edit/publish/${query({ id: courseId })}`,
  versions: (courseId: string) => `/edit/versions/${query({ id: courseId })}`,
  version: (courseId: string, number: number) => `/edit/versions/view/${query({ id: courseId, n: number })}`,
  compare: (courseId: string, a: number, b: number) => `/edit/compare/${query({ id: courseId, a, b })}`,
  staff: (courseId: string) => `/edit/staff/${query({ id: courseId })}`,
  students: (courseId: string) => `/edit/students/${query({ id: courseId })}`,
  attempt: (attemptId: string, courseId?: string) => `/edit/attempt/${query({ id: attemptId, course: courseId })}`,
  preview: (courseId: string, stepId?: string, block?: number) =>
    `/edit/preview/${query({ id: courseId, step: stepId, block })}`,
}
