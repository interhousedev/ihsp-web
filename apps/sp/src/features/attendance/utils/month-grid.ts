import { addDays } from "@ihsp/i18n"

/** `2026-10` of `2026-10-07`. */
export function monthOf(date: string): string {
  return date.slice(0, 7)
}

export function shiftMonth(month: string, delta: number): string {
  const [year = 1970, mon = 1] = month.split("-").map(Number)
  const index = year * 12 + (mon - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`
}

/** The weeks of a month, Monday first; `null` fills the days of the neighbouring months. */
export function monthGrid(month: string): (string | null)[][] {
  const first = `${month}-01`
  const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7
  const [year = 1970, mon = 1] = month.split("-").map(Number)
  const length = new Date(Date.UTC(year, mon, 0)).getUTCDate()
  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length }, (_, index) => addDays(first, index)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7))
}

/** First day of the month of `date`. */
export function firstOfMonth(date: string): string {
  return `${monthOf(date)}-01`
}
