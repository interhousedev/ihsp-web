/** The student profile (static export: everything is in the query string). */
export function studentProfileHref(
  studentId: string,
  scope?: { subject?: string | null; group?: string | null; subgroup?: number | null },
): string {
  const query = new URLSearchParams({ id: studentId })
  if (scope?.subject) query.set("subject", scope.subject)
  if (scope?.subject && scope.group) {
    query.set("group", scope.group)
    if (scope.subgroup !== null && scope.subgroup !== undefined) query.set("subgroup", String(scope.subgroup))
  }
  return `/students/view/?${query.toString()}`
}
