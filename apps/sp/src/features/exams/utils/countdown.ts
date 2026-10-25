import type { AssessmentItem } from "@ihsp/api"

/** What a countdown says: the day itself, its neighbours, or a number of days ahead or behind. */
export type Countdown =
  | { kind: "today" }
  | { kind: "tomorrow" }
  | { kind: "yesterday" }
  | { kind: "in"; days: number }
  | { kind: "ago"; days: number }

/** The words for `days_left` (the server counts from its own "today"; negative once the control is past). */
export function countdownOf(daysLeft: number): Countdown {
  if (daysLeft === 0) return { kind: "today" }
  if (daysLeft === 1) return { kind: "tomorrow" }
  if (daysLeft === -1) return { kind: "yesterday" }
  return daysLeft > 0 ? { kind: "in", days: daysLeft } : { kind: "ago", days: -daysLeft }
}

/**
 * A control week that began before `today` and has not ended: for such a week without a date the server sends today as
 * its date, so "today" would be a misleading countdown.
 */
export function isWeekRunning(item: Pick<AssessmentItem, "has_date" | "period">, today: string): boolean {
  return !item.has_date && item.period !== null && item.period.start < today && today <= item.period.end
}
