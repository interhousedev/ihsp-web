import type { ControlPeriodItem } from "@ihsp/api"

/** The control week (ПК or ИК) a date lies in, or undefined. */
export function periodOn(periods: readonly ControlPeriodItem[], date: string): ControlPeriodItem | undefined {
  return periods.find((period) => date >= period.start && date <= period.end)
}

/** Where a date sits in its period: the bar of a banner is rounded at the `start` and the `end`. */
export function periodEdge(period: ControlPeriodItem, date: string): "single" | "start" | "end" | "middle" {
  if (period.start === period.end) return "single"
  if (date === period.start) return "start"
  return date === period.end ? "end" : "middle"
}
