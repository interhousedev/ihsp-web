/** The range picker of the Limits & usage page: the last 7, 30 or 90 days, or this month (Tashkent). */
export const RANGES = ["7", "30", "90", "month"] as const
export type RangeKey = (typeof RANGES)[number]

/** The groups of the limits editor, in the order they are shown. */
export const LIMIT_GROUPS = ["assistant", "smart", "notebooks", "web_search", "lms"] as const

const TASHKENT = "Asia/Tashkent"

/** Today in Tashkent as `YYYY-MM-DD`. */
export function todayIso(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: TASHKENT })
}

/** `YYYY-MM-DD` shifted by a number of days (calendar arithmetic, no time zone). */
export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/** The first and last day (inclusive) of a range picker choice. */
export function rangeOf(range: RangeKey, today: string): { from: string; to: string } {
  if (range === "month") return { from: `${today.slice(0, 8)}01`, to: today }
  return { from: addDays(today, -(Number(range) - 1)), to: today }
}

/**
 * US dollars in the admin's locale: whole cents from a dollar up, finer below (the daily cost of one call is often a
 * fraction). `locale` is the one of `useFormatters()`.
 */
export function usd(value: number, locale = "en"): string {
  const fine = value > 0 && value < 1
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: fine ? 4 : 2,
  }).format(value)
}

/** A count with the locale's thousands separators, or in thousands and millions when it is large. */
export function compact(value: number, locale = "en"): string {
  return new Intl.NumberFormat(locale, { notation: value >= 10_000 ? "compact" : "standard" }).format(value)
}

/** The whole number of a limit with the locale's thousands separators. */
export function number(value: number | null, locale = "en"): string {
  return value === null ? "—" : new Intl.NumberFormat(locale).format(value)
}

/** The value a limit takes for "no cap" (the API's -1). */
export const UNLIMITED = -1

/** A limit as the lists show it: "∞" for no cap, otherwise the whole number. */
export function limitNumber(value: number | null, locale = "en"): string {
  return value === UNLIMITED ? "∞" : number(value, locale)
}

/** Tokens of one row: the input and output sides together. */
export function tokens(row: { tokens_in: number; tokens_out: number }): number {
  return row.tokens_in + row.tokens_out
}
