import type { LessonItem } from "@ihsp/api"
import { addDays, compareIso } from "@ihsp/i18n"

export function isIsoDate(value: string | null | undefined): value is string {
  return (
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  )
}

/** Saturday and Sunday: no lessons, so the calendar does not draw them in the week or the day views. */
export function isWeekend(date: string): boolean {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return weekday === 0 || weekday === 6
}

/** The date itself on a study day; a Saturday or Sunday gives the Monday after it, so the calendar opens on lessons. */
export function studyDayOf(date: string): string {
  let day = date
  while (isWeekend(day)) day = addDays(day, 1)
  return day
}

/** `[monday, friday]` as the `from` / `to` of `GET /v1/me/timetable`: the study week has five days. */
export function weekRange(monday: string): { from: string; to: string } {
  return { from: monday, to: addDays(monday, 4) }
}

/** The five study days of the week that starts on `monday`: Monday to Friday. */
export function weekDays(monday: string): string[] {
  return Array.from({ length: 5 }, (_, index) => addDays(monday, index))
}

export function lessonsOn(lessons: readonly LessonItem[], date: string): LessonItem[] {
  return lessons
    .filter((lesson) => lesson.date === date)
    .toSorted((a, b) => a.period - b.period || compareIso(a.starts_at, b.starts_at))
}

/** Subgroups named in the audience of a lesson (`[1]`, `[1, 2]` or `[]` for the whole group). */
export function subgroupsOf(lesson: Pick<LessonItem, "audience">): (1 | 2)[] {
  const found = new Set<1 | 2>()
  for (const item of lesson.audience) if (item.subgroup !== null) found.add(item.subgroup)
  return [...found].toSorted()
}
