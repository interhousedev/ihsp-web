import type { GroupAttendanceParams, GroupAttendanceView } from "@ihsp/api"
import { addDays, todayIso } from "@ihsp/i18n"

export const VIEWS: readonly GroupAttendanceView[] = ["student", "subject", "day", "lesson"]

export function parseView(value: string | null | undefined): GroupAttendanceView {
  return VIEWS.find((view) => view === value) ?? "student"
}

function isIsoDate(value: string | null | undefined): value is string {
  return (
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  )
}

/** The report range: `?from=&to=` when valid, otherwise the last 30 days. */
export function reportParams(
  view: GroupAttendanceView,
  from: string | null,
  to: string | null,
): Required<GroupAttendanceParams> {
  const end = isIsoDate(to) ? to : todayIso()
  const start = isIsoDate(from) ? from : addDays(end, -30)
  return start <= end ? { view, from: start, to: end } : { view, from: end, to: start }
}
