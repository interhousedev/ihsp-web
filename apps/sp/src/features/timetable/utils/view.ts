import { addDays, startOfWeek } from "@ihsp/i18n"
import { shiftMonth } from "../../attendance/utils/month-grid"
import { isWeekend } from "./week"

export const VIEWS = ["day", "week", "month"] as const
export type CalendarView = (typeof VIEWS)[number]

/** The `?view=` of the address; a missing or unknown value is `null` (the device picks the default). */
export function parseView(value: string | null | undefined): CalendarView | null {
  return VIEWS.find((view) => view === value) ?? null
}

/** Whether two dates fall in the same day, week or month of the view. */
export function samePeriod(view: CalendarView, a: string, b: string): boolean {
  if (view === "day") return a === b
  if (view === "week") return startOfWeek(a) === startOfWeek(b)
  return a.slice(0, 7) === b.slice(0, 7)
}

/**
 * The focus date one step away in the view. A day steps to the previous or next study day, so Friday goes to Monday
 * and Monday goes back to Friday; a week moves seven days; a month goes to the first day of the next or previous month.
 */
export function stepDate(view: CalendarView, day: string, direction: 1 | -1): string {
  if (view === "day") return nextStudyDay(day, direction)
  if (view === "week") return addDays(day, 7 * direction)
  return `${shiftMonth(day.slice(0, 7), direction)}-01`
}

/** The next (or previous) date that is not Saturday or Sunday. */
export function nextStudyDay(day: string, direction: 1 | -1): string {
  let date = addDays(day, direction)
  while (isWeekend(date)) date = addDays(date, direction)
  return date
}
