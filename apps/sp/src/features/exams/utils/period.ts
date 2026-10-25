/** Formats one calendar date (`YYYY-MM-DD`) with the given options; the hook passes the user's language. */
export type DayFormatter = (isoDate: string, options: Intl.DateTimeFormatOptions) => string

const DAY_AND_MONTH: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
const DAY_ONLY: Intl.DateTimeFormatOptions = { day: "numeric" }

/**
 * A control week as short text: `12–17 Oct` inside one month, `28 Oct – 2 Nov` across two, `2 Oct` for a single day.
 * The year is left out: control weeks are always close to today.
 */
export function formatPeriod(period: { start: string; end: string }, format: DayFormatter): string {
  if (period.start === period.end) return format(period.start, DAY_AND_MONTH)
  if (period.start.slice(0, 7) === period.end.slice(0, 7)) {
    return `${format(period.start, DAY_ONLY)}–${format(period.end, DAY_AND_MONTH)}`
  }
  return `${format(period.start, DAY_AND_MONTH)} – ${format(period.end, DAY_AND_MONTH)}`
}
