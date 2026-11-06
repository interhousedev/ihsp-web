/** ISO weekdays used by the API: 1 = Monday ... 7 = Sunday. Study days are Monday to Friday. */
export const STUDY_WEEKDAYS = [1, 2, 3, 4, 5] as const

/** Every day can have lesson blocks; Saturday and Sunday are closed until they do. */
export const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const

/**
 * A date (2026-10-05 is a Monday) with the given ISO weekday, so weekday names come from the user's locale
 * (`formatters.weekday(weekdayDate(1), "long")`) and not from message files.
 */
export function weekdayDate(weekday: number): string {
  return `2026-10-${String(4 + weekday).padStart(2, "0")}`
}
