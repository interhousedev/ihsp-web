import { TIME_ZONE } from "./locales"

/** A calendar date without a time, `YYYY-MM-DD` (what the API uses for lessons, terms and homework). */
export type IsoDate = string

const DAY_MS = 24 * 3600 * 1000

function parse(date: IsoDate): number {
  return Date.parse(`${date}T00:00:00Z`)
}

function stringify(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Today's date in Asia/Tashkent, whatever the device time zone is. */
export function todayIso(now: DateInput = new Date()): IsoDate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof now === "object" ? now : new Date(now))
}

type DateInput = Date | number

export function addDays(date: IsoDate, days: number): IsoDate {
  return stringify(parse(date) + days * DAY_MS)
}

/** Monday of the week that contains `date` (weeks start on Monday). */
export function startOfWeek(date: IsoDate): IsoDate {
  const weekday = new Date(parse(date)).getUTCDay() // 0 = Sunday
  return addDays(date, -((weekday + 6) % 7))
}

/** The seven dates of the week that starts on `monday`. */
export function weekDates(monday: IsoDate): IsoDate[] {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

export function compareIso(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Time of day `HH:mm` → minutes since midnight (for sorting and the grid). */
export function minutesOfDay(time: string): number {
  const [hours = "0", minutes = "0"] = time.split(":")
  return Number(hours) * 60 + Number(minutes)
}
