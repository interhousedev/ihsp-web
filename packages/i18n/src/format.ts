import { currentLocale } from "./locale-store"
import { TIME_ZONE, type Locale } from "./locales"

export type DateInput = Date | string | number

const INTL_LOCALES: Record<Locale, string> = { uz: "uz-Latn-UZ", ru: "ru-RU", en: "en-GB" }

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value)
}

function format(value: DateInput, locale: Locale, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], { timeZone: TIME_ZONE, ...options }).format(toDate(value))
}

/** `7 Oct 2026` style date in Asia/Tashkent. Date-only strings (`2026-10-07`) stay on that day. */
export function formatDate(
  value: DateInput,
  locale: Locale = currentLocale(),
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  return format(value, locale, options)
}

/** `14:05`, 24-hour, Asia/Tashkent. */
export function formatTime(value: DateInput, locale: Locale = currentLocale()): string {
  return format(value, locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
}

/** `7 Oct 2026, 14:05`. */
export function formatDateTime(value: DateInput, locale: Locale = currentLocale()): string {
  return format(value, locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
}

/** Weekday name, e.g. `Wed` (`style: "long"` for `Wednesday`). */
export function formatWeekday(
  value: DateInput,
  locale: Locale = currentLocale(),
  style: "short" | "long" | "narrow" = "short",
): string {
  return format(value, locale, { weekday: style })
}

const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 365 * 24 * 3600 * 1000 },
  { unit: "month", ms: 30 * 24 * 3600 * 1000 },
  { unit: "week", ms: 7 * 24 * 3600 * 1000 },
  { unit: "day", ms: 24 * 3600 * 1000 },
  { unit: "hour", ms: 3600 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
]

/** `3 minutes ago`, `in 2 days`, `yesterday`. */
export function formatRelative(
  value: DateInput,
  locale: Locale = currentLocale(),
  now: DateInput = Date.now(),
): string {
  const diff = toDate(value).getTime() - toDate(now).getTime()
  const formatter = new Intl.RelativeTimeFormat(INTL_LOCALES[locale], { numeric: "auto" })
  for (const { unit, ms } of UNITS) {
    if (Math.abs(diff) >= ms) return formatter.format(Math.round(diff / ms), unit)
  }
  return formatter.format(Math.round(diff / 1000), "second")
}
