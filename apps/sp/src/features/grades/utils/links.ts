/** The Marks tab of a subject: opening a grades row shows all its marks (WEB-13). */
export function subjectMarksHref(subjectId: string, semester: number | undefined): string {
  const query = new URLSearchParams({ id: subjectId, tab: "marks" })
  if (semester) query.set("semester", String(semester))
  return `/subjects/view/?${query.toString()}`
}
