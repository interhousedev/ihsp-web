const DAY = 86_400_000
export const WEEK_MS = 7 * DAY
const MAX_WEEKS = 60

export type GanttBar = {
  key: string
  kind: "task" | "test"
  title: string
  begin: number
  end: number
  tone: "primary" | "success" | "danger" | "warning"
  href: string
}
export type GanttMarker = { key: string; title: string; at: number; href: string; kind: "deadline" | "registration" }
export type GanttModel = {
  /** Monday 00:00 UTC of each week column. */
  weeks: number[]
  start: number
  span: number
  bars: GanttBar[]
  markers: GanttMarker[]
}

export function utcDay(value: string): number {
  return Date.parse(`${value}T00:00:00Z`)
}

export function mondayOf(time: number): number {
  const day = new Date(time).getUTCDay()
  return time - ((day + 6) % 7) * DAY
}

/**
 * Lays out prep work on a weekly axis: the columns start on the Monday before the earliest item (or last week) and
 * reach the latest item (or twelve weeks ahead), capped to a year so one far-off deadline cannot flatten the chart.
 */
export function buildGantt(bars: GanttBar[], markers: GanttMarker[], today: number): GanttModel {
  const times = [...bars.flatMap((bar) => [bar.begin, bar.end]), ...markers.map((marker) => marker.at)]
  const first = mondayOf(Math.min(today - WEEK_MS, ...times))
  const last = Math.max(today + 12 * WEEK_MS, ...times)
  const count = Math.min(Math.ceil((last + DAY - first) / WEEK_MS), MAX_WEEKS)
  const weeks = Array.from({ length: count }, (_, index) => first + index * WEEK_MS)
  const end = first + count * WEEK_MS
  const visible = (time: number) => time >= first && time < end
  return {
    weeks,
    start: first,
    span: count * WEEK_MS,
    bars: bars.filter((bar) => bar.end >= first && bar.begin < end),
    markers: markers.filter((marker) => visible(marker.at)),
  }
}
