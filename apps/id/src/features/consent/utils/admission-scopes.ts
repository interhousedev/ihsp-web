/** Admission MCP scopes: their own labels, and the staff scopes that reach other students' data. */
const ADMISSION_PREFIX = "admission:"
const STAFF_SCOPES = new Set(["caseload:read", "students:read", "students:write", "documents:review"])

/** The admission scope without the `admission:` source prefix of the all-in-one server, or null for other servers. */
export function admissionScope(server: string | null, scope: string): string | null {
  if (scope.startsWith(ADMISSION_PREFIX)) return scope.slice(ADMISSION_PREFIX.length)
  return server === "admission" ? scope : null
}

/** Message key of an admission scope label (`consent.admissionScopes.application_read`). */
export function admissionScopeKey(plain: string): string {
  return `consent.admissionScopes.${plain.replace(/[.:]/g, "_")}`
}

export function isAdmissionStaffScope(server: string | null, scope: string): boolean {
  const plain = admissionScope(server, scope)
  return plain !== null && STAFF_SCOPES.has(plain)
}
