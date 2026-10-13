import type { TeachingLesson } from "@ihsp/api"
import { addDays, startOfWeek, type IsoDate } from "@ihsp/i18n"

/** The group's lessons split into this week (Monday to Sunday) and the weeks after, earliest first. */
export function splitLessons(
  lessons: readonly TeachingLesson[],
  today: IsoDate,
): { thisWeek: TeachingLesson[]; upcoming: TeachingLesson[] } {
  const nextMonday = addDays(startOfWeek(today), 7)
  const sorted = lessons.toSorted((a, b) => a.starts_at.localeCompare(b.starts_at))
  return {
    thisWeek: sorted.filter((lesson) => lesson.date < nextMonday),
    upcoming: sorted.filter((lesson) => lesson.date >= nextMonday),
  }
}
