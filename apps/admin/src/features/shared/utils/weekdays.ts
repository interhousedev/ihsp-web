/** ISO weekdays used by the API: 1 = Monday ... 6 = Saturday. Study days are Monday to Saturday. */
export const STUDY_WEEKDAYS = [1, 2, 3, 4, 5, 6] as const

/**
 * A date (2026-10-05 is a Monday) with the given ISO weekday, so weekday names come from the user's locale
 * (`formatters.weekday(weekdayDate(1), "long")`) and not from message files.
 */
export function weekdayDate(weekday: number): string {
  return `2026-10-${String(4 + weekday).padStart(2, "0")}`
}
