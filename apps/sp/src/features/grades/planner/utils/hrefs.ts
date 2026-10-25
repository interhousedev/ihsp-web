/** The mark planner of a subject: `/grades/plan/?subject=<id>` and, for another semester, `&semester=<n>`. */
export function plannerHref(subjectId: string, semester?: number): string {
  const query = new URLSearchParams({ subject: subjectId })
  if (semester) query.set("semester", String(semester))
  return `/grades/plan/?${query.toString()}`
}

/** The grades page, for "Back": the same semester the planner shows. */
export function gradesHref(semester?: number): string {
  return semester ? `/grades/?semester=${semester}` : "/grades/"
}
