/** Addresses of the pages of this app. Entity pages take their ids from the query string (static export). */

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
  course: (slug: string) => `/course/${query({ slug })}`,
  /** `course` is the course id; `slug` lets the player load the outline for the previous and next links. */
  step: (courseId: string, stepId: string, slug?: string) =>
    `/course/step/${query({ course: courseId, step: stepId, slug })}`,
  edit: (courseId: string) => `/edit/${query({ id: courseId })}`,
  editStep: (stepId: string) => `/edit/step/${query({ id: stepId })}`,
  publish: (courseId: string) => `/edit/publish/${query({ id: courseId })}`,
  versions: (courseId: string) => `/edit/versions/${query({ id: courseId })}`,
  version: (courseId: string, number: number) => `/edit/versions/view/${query({ id: courseId, n: number })}`,
  compare: (courseId: string, a: number, b: number) => `/edit/compare/${query({ id: courseId, a, b })}`,
  staff: (courseId: string) => `/edit/staff/${query({ id: courseId })}`,
  students: (courseId: string) => `/edit/students/${query({ id: courseId })}`,
  attempt: (attemptId: string, courseId?: string) => `/edit/attempt/${query({ id: attemptId, course: courseId })}`,
  preview: (courseId: string, stepId?: string) => `/edit/preview/${query({ id: courseId, step: stepId })}`,
}
