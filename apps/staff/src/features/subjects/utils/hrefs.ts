/** Routes of the subject pages (static export: the subject is in the query string). */
export const SUBJECTS_HREF = "/subjects/"

/** The page of one subject the teacher teaches. */
export function subjectHref(subjectId: string): string {
  return `/subjects/view/?id=${encodeURIComponent(subjectId)}`
}

function groupQuery(subjectId: string, groupId: string, subgroup: number | null): string {
  const query = new URLSearchParams({ id: subjectId, group: groupId })
  if (subgroup !== null) query.set("subgroup", String(subgroup))
  return query.toString()
}

/** The page of a group (or one subgroup) the teacher teaches the subject: students, notebook, lessons. */
export function subjectGroupHref(subjectId: string, groupId: string, subgroup: number | null = null): string {
  return `/subjects/group/?${groupQuery(subjectId, groupId, subgroup)}`
}

/** The page of one student of a subject group: marks, homework, attendance. */
export function subjectStudentHref(
  subjectId: string,
  groupId: string,
  subgroup: number | null,
  studentId: string,
): string {
  return `/subjects/student/?${groupQuery(subjectId, groupId, subgroup)}&student=${encodeURIComponent(studentId)}`
}
