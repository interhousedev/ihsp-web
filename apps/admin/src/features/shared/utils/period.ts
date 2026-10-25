import type { ControlPeriod } from "@ihsp/api"

type DateFormat = (value: string, options?: Intl.DateTimeFormatOptions) => string

/**
 * A week as short as it can be read: `12–16 Oct`, `28 Oct – 1 Nov`, or with the years when it crosses New Year.
 * `format` is `useFormatters().date`.
 */
export function formatPeriod(format: DateFormat, period: ControlPeriod): string {
  const { start, end } = period
  const dayMonth: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  if (start === end) return format(start, dayMonth)
  if (start.slice(0, 4) !== end.slice(0, 4)) return `${format(start)} – ${format(end)}`
  if (start.slice(5, 7) !== end.slice(5, 7)) return `${format(start, dayMonth)} – ${format(end, dayMonth)}`
  return `${format(start, { day: "numeric" })}–${format(end, dayMonth)}`
}
