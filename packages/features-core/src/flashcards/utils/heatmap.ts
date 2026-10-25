import type { FlashcardStatsDay } from "@ihsp/api"

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4

export type HeatmapCell = {
  /** `YYYY-MM-DD`. */
  date: string
  count: number
  level: HeatmapLevel
  /** After `today`: nothing can have been studied yet. */
  future: boolean
}

/** One column of the grid: Monday to Sunday, `null` for days outside the year. */
export type HeatmapWeek = (HeatmapCell | null)[]

const DAY_MS = 86_400_000

function utc(year: number, month: number, day: number): number {
  return Date.UTC(year, month, day)
}

function iso(time: number): string {
  return new Date(time).toISOString().slice(0, 10)
}

/** Monday is 0 and Sunday is 6 (Anki's heatmap starts its weeks on Monday). */
function mondayIndex(time: number): number {
  return (new Date(time).getUTCDay() + 6) % 7
}

/** Colour step of a day: 0 for no reviews, 1 to 4 relative to the busiest day of the year. */
export function heatmapLevel(count: number, max: number): HeatmapLevel {
  if (count <= 0 || max <= 0) return 0
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

/** The weeks of `year` (Monday first) with the review count of every day. */
export function buildHeatmapWeeks(
  year: number,
  days: readonly FlashcardStatsDay[],
  today: string = iso(Date.now()),
): HeatmapWeek[] {
  const counts = new Map(days.map((day) => [day.date, day.count]))
  const max = Math.max(0, ...counts.values())
  const first = utc(year, 0, 1)
  const last = utc(year, 11, 31)
  const weeks: HeatmapWeek[] = []
  let cursor = first - mondayIndex(first) * DAY_MS
  while (cursor <= last) {
    const week: HeatmapWeek = []
    for (let index = 0; index < 7; index += 1) {
      const time = cursor + index * DAY_MS
      if (time < first || time > last) {
        week.push(null)
      } else {
        const date = iso(time)
        const count = counts.get(date) ?? 0
        week.push({ date, count, level: heatmapLevel(count, max), future: date > today })
      }
    }
    weeks.push(week)
    cursor += 7 * DAY_MS
  }
  return weeks
}

/** Where each month starts: the index of the week that holds its first day, and the month (0 to 11). */
export function monthStarts(weeks: readonly HeatmapWeek[]): { week: number; month: number }[] {
  const starts: { week: number; month: number }[] = []
  weeks.forEach((week, index) => {
    for (const cell of week) {
      if (cell && cell.date.endsWith("-01")) starts.push({ week: index, month: Number(cell.date.slice(5, 7)) - 1 })
    }
  })
  return starts
}
