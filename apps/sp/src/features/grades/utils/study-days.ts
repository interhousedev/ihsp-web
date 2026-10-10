import { addDays } from "@ihsp/i18n"

/** The lyceum has lessons from Monday to Friday only. */
function isWeekend(date: string): boolean {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return weekday === 0 || weekday === 6
}

/** The previous (`-1`) or next (`1`) study day: Saturdays and Sundays are skipped (UF-WEB-10, "arrows jump between study days"). */
export function shiftStudyDay(date: string, direction: -1 | 1): string {
  let next = addDays(date, direction)
  while (isWeekend(next)) next = addDays(next, direction)
  return next
}
