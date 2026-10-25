import type { LessonItem, LessonResult } from "@ihsp/api"

/** The attendance states a lesson can show on the calendar (a lesson with no attendance taken has none). */
export type MarkedState = "present" | "late" | "absent"

/** Which state a day shows when its lessons differ: the worst one wins. */
const WORST_FIRST: MarkedState[] = ["absent", "late", "present"]

/**
 * The state of each day: the worst state among its lessons with attendance taken. The lesson results are joined to the
 * lessons that give their date; days without any attendance are not in the map.
 */
export function dayStatus(
  lessons: readonly Pick<LessonItem, "id" | "date">[],
  results: readonly LessonResult[],
): Map<string, MarkedState> {
  const dates = new Map(lessons.map((lesson) => [lesson.id, lesson.date]))
  const status = new Map<string, MarkedState>()
  for (const result of results) {
    const date = dates.get(result.lesson_id)
    if (!date || result.attendance === null) continue
    const current = status.get(date)
    if (current === undefined || WORST_FIRST.indexOf(result.attendance) < WORST_FIRST.indexOf(current)) {
      status.set(date, result.attendance)
    }
  }
  return status
}

/** How many lessons of the list have each state; results of lessons outside the list are ignored. */
export function countStates(
  lessons: readonly Pick<LessonItem, "id">[],
  results: readonly LessonResult[],
): Record<MarkedState, number> {
  const ids = new Set(lessons.map((lesson) => lesson.id))
  const counts: Record<MarkedState, number> = { present: 0, late: 0, absent: 0 }
  for (const result of results) {
    if (result.attendance !== null && ids.has(result.lesson_id)) counts[result.attendance] += 1
  }
  return counts
}
