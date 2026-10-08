import { isApiError, type AttendanceSheet } from "@ihsp/api"

function isSheet(value: unknown): value is AttendanceSheet {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Partial<AttendanceSheet>
  return typeof candidate.version === "number" && Array.isArray(candidate.roster)
}

/**
 * The current sheet of a `409 common/conflict` (UF-STF-06 3a). The backend sends it as `params.theirs` and
 * `params.current` (plus `params.version`); either one is accepted.
 */
export function conflictingSheet(error: unknown): AttendanceSheet | null {
  if (!isApiError(error) || error.type !== "common/conflict") return null
  const candidate = error.params.theirs ?? error.params.current
  return isSheet(candidate) ? candidate : null
}

/** `403 attendance/window-closed`: the 7-day window passed while the page was open. */
export function isWindowClosed(error: unknown): boolean {
  return isApiError(error) && error.type === "attendance/window-closed"
}

/** `attendance/lesson-cancelled`: nobody takes attendance of a cancelled lesson. */
export function isLessonCancelled(error: unknown): boolean {
  return isApiError(error) && error.type === "attendance/lesson-cancelled"
}
