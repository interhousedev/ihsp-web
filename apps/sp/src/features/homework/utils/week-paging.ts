const DAY_MS = 86_400_000

/** The Monday-to-Friday week that holds `date` (a Sunday belongs to the week that began on the Monday before it). */
export function weekOf(date: string): { from: string; to: string } {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  const offset = weekday === 0 ? 6 : weekday - 1
  const monday = new Date(new Date(`${date}T00:00:00Z`).getTime() - offset * DAY_MS)
  const friday = new Date(monday.getTime() + 4 * DAY_MS)
  return { from: monday.toISOString().slice(0, 10), to: friday.toISOString().slice(0, 10) }
}

/** Items two per row, so two homework cards sit side by side on a wide screen and stack on a phone. */
export function pairCards<T>(items: readonly T[]): T[][] {
  const rows: T[][] = []
  for (let index = 0; index < items.length; index += 2) rows.push(items.slice(index, index + 2))
  return rows
}

/** The Monday-to-Friday week `weeks` weeks away from the week that holds `from`. */
export function shiftWeek(from: string, weeks: -1 | 1): { from: string; to: string } {
  return weekOf(new Date(new Date(`${from}T00:00:00Z`).getTime() + weeks * 7 * DAY_MS).toISOString().slice(0, 10))
}

/** The school week shown on a day: a weekend shows the coming Monday to Friday (the school week is Mon-Fri). */
export function schoolWeekOf(date: string): { from: string; to: string } {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  if (weekday === 6)
    return weekOf(new Date(new Date(`${date}T00:00:00Z`).getTime() + 2 * DAY_MS).toISOString().slice(0, 10))
  if (weekday === 0)
    return weekOf(new Date(new Date(`${date}T00:00:00Z`).getTime() + DAY_MS).toISOString().slice(0, 10))
  return weekOf(date)
}
