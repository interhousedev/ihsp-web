import type { LessonItem } from "@ihsp/api"
import { addDays, compareIso, startOfWeek, todayIso } from "@ihsp/i18n"

export function isIsoDate(value: string | null | undefined): value is string {
  return (
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  )
}

/** The Monday of a `?week=` value; a missing or broken value gives this week. */
export function mondayOf(value: string | null | undefined): string {
  return startOfWeek(isIsoDate(value) ? value : todayIso())
}

/** The school week is Monday to Friday (the lyceum does not study on Saturdays). */
export const SCHOOL_DAYS = 5

/** The five school days of the week that starts on `monday`, Monday first. */
export function weekDays(monday: string): string[] {
  return Array.from({ length: SCHOOL_DAYS }, (_, index) => addDays(monday, index))
}

/** `[monday, friday]` as the `from` / `to` of `GET /v1/staff/timetable`. */
export function weekRange(monday: string): { from: string; to: string } {
  return { from: monday, to: addDays(monday, SCHOOL_DAYS - 1) }
}

export type Period = { period: number; starts_at: string; ends_at: string }

/** The periods that have a lesson this week, with the bell times of the first lesson found in each. */
export function periodsOf(lessons: readonly LessonItem[]): Period[] {
  const byPeriod = new Map<number, Period>()
  for (const lesson of lessons) {
    if (!byPeriod.has(lesson.period)) {
      byPeriod.set(lesson.period, { period: lesson.period, starts_at: lesson.starts_at, ends_at: lesson.ends_at })
    }
  }
  return [...byPeriod.values()].toSorted((a, b) => a.period - b.period)
}

export function lessonsOn(lessons: readonly LessonItem[], date: string): LessonItem[] {
  return lessons
    .filter((lesson) => lesson.date === date)
    .toSorted((a, b) => a.period - b.period || compareIso(a.starts_at, b.starts_at))
}

export function lessonsAt(lessons: readonly LessonItem[], date: string, period: number): LessonItem[] {
  return lessonsOn(lessons, date).filter((lesson) => lesson.period === period)
}

/** The day shown on phones: `?day=` when it is inside the week, otherwise today (if in the week) or Monday. */
export function selectedDay(monday: string, requested: string | null | undefined): string {
  const days = weekDays(monday)
  if (isIsoDate(requested) && days.includes(requested)) return requested
  const today = todayIso()
  return days.includes(today) ? today : monday
}
