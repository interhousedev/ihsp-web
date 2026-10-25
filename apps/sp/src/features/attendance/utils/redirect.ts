import { isIsoDate } from "../../timetable/utils/week"
import { parseView } from "../../timetable/utils/view"

/**
 * Where the old attendance address goes: the calendar's month view (attendance is a month calendar), or the view and
 * the day the old address carried. The calendar keeps the attendance, so `/attendance/` has no page of its own.
 */
export function calendarRedirect(search: string): string {
  const params = new URLSearchParams(search)
  const query = new URLSearchParams({ view: parseView(params.get("view")) ?? "month" })
  const day = params.get("day")
  if (isIsoDate(day)) query.set("day", day)
  return `/timetable/?${query.toString()}`
}
