import { formatTime } from "@ihsp/i18n"

/** Tashkent has no daylight saving time, so its offset to UTC is always +05:00. */
const TASHKENT_OFFSET = "+05:00"

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function isTime(value: string): boolean {
  return TIME_PATTERN.test(value)
}

/** `starts_at` of the API for a day and a `HH:MM` time of day in Tashkent; null without a time. */
export function startsAtOf(date: string, time: string): string | null {
  return date !== "" && isTime(time) ? `${date}T${time}:00${TASHKENT_OFFSET}` : null
}

/** `HH:MM` in Tashkent for the `starts_at` of the API; an empty text when there is none. */
export function timeOfStartsAt(startsAt: string | null): string {
  return startsAt === null ? "" : formatTime(startsAt, "en")
}
