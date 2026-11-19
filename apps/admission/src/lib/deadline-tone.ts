import { todayIso } from "@ihsp/i18n"

/** A deadline this many days away or fewer is urgent. */
export const URGENT_DAYS = 30

export type DeadlineTone = "urgent" | "normal" | "past"

function dayNumber(day: string): number {
  const [year = 0, month = 1, date = 1] = day.slice(0, 10).split("-").map(Number)
  return Date.UTC(year, month - 1, date) / 86_400_000
}

/** Whole days from today (Asia/Tashkent) to `date`; negative when the date has passed. */
export function daysLeft(date: string, now: number | Date = new Date()): number {
  return dayNumber(date) - dayNumber(todayIso(now))
}

export function deadlineTone(date: string | null | undefined, now: number | Date = new Date()): DeadlineTone {
  if (!date) return "normal"
  const days = daysLeft(date, now)
  if (days < 0) return "past"
  return days <= URGENT_DAYS ? "urgent" : "normal"
}

/** The nearest deadline that is not past; undated items sort last. */
export function compareDeadline(a: string | null | undefined, b: string | null | undefined): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.localeCompare(b)
}
