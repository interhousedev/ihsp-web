import type { AssessmentItem, ControlName } from "@ihsp/api"

const ORDER: Record<ControlName, number> = { midterm_1: 1, midterm_2: 2, final: 3 }

/**
 * A control that is not earlier in its semester than `current` belongs to an earlier semester (the list is a wide date
 * range, so it can reach back to the last final). Assessments carry no semester, so the control weeks tell them apart.
 */
function fromEarlierSemester(item: AssessmentItem, current: AssessmentItem): boolean {
  if (!item.control || !current.control) return false
  return ORDER[item.control] >= ORDER[current.control]
}

/**
 * The latest control of the same subject and semester with a date before `current`; weeks without a date are not
 * controls yet. Null for the first control of the semester.
 */
export function previousControl(items: AssessmentItem[], current: AssessmentItem): AssessmentItem | null {
  const earlier = items.filter(
    (item) =>
      item.id !== current.id &&
      item.subject.id === current.subject.id &&
      item.has_date &&
      item.status !== "cancelled" &&
      item.date < current.date &&
      !fromEarlierSemester(item, current),
  )
  const latest = earlier.toSorted(
    (a, b) => b.date.localeCompare(a.date) || (b.starts_at ?? "").localeCompare(a.starts_at ?? ""),
  )
  return latest[0] ?? null
}
