import type { CurriculumView } from "@ihsp/api"
import { addDays, startOfWeek } from "@ihsp/i18n"

type SemesterDates = Pick<CurriculumView["semesters"][number], "starts_on" | "ends_on">

/** As on the backend: the school year starts in autumn, so a semester from August on opens a year. */
const FIRST_HALF_MONTH = 8
const DAY_MS = 86_400_000

function opensYear(startsOn: string): boolean {
  return Number(startsOn.slice(5, 7)) >= FIRST_HALF_MONTH
}

/**
 * The academic week of a date: week 1 is the Monday-to-Sunday week holding the first day of the autumn semester. `null`
 * before any known year and after the last semester of its year (the summer has no academic weeks).
 */
export function academicWeek(date: string, semesters: readonly SemesterDates[]): number | null {
  const monday = startOfWeek(date)
  const sunday = addDays(monday, 6)
  const known = semesters.filter(
    (semester): semester is SemesterDates & { starts_on: string } => semester.starts_on !== null,
  )
  const start = known
    .map((semester) => semester.starts_on)
    .filter((startsOn) => opensYear(startsOn) && startsOn <= sunday)
    .toSorted()
    .at(-1)
  if (!start) return null
  const nextYear = known
    .map((semester) => semester.starts_on)
    .filter((startsOn) => opensYear(startsOn) && startsOn > start)
    .toSorted()[0]
  const ends = known
    .filter((semester) => semester.starts_on >= start && (!nextYear || semester.starts_on < nextYear))
    .flatMap((semester) => (semester.ends_on ? [semester.ends_on] : []))
    .toSorted()
    .at(-1)
  if (ends && monday > ends) return null
  const days = (Date.parse(`${monday}T00:00:00Z`) - Date.parse(`${startOfWeek(start)}T00:00:00Z`)) / DAY_MS
  return Math.round(days / 7) + 1
}
