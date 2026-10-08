import { addDays } from "@ihsp/i18n"

function isSunday(date: string): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 0
}

/** The previous (`-1`) or next (`1`) study day: Sundays are skipped (UF-WEB-10, "arrows jump between study days"). */
export function shiftStudyDay(date: string, direction: -1 | 1): string {
  let next = addDays(date, direction)
  if (isSunday(next)) next = addDays(next, direction)
  return next
}
