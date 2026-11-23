import type { QuestBody, QuestGoalKind, ReviewGradeRating } from "@ihsp/api"

/** Total XP needed to reach level `level` (level 1 starts at 0): `50 * L * (L - 1)`. */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1)
}

/** The level for a total XP, with the XP into it and the XP that level spans. */
export function levelFromXp(xp: number): { level: number; into: number; span: number } {
  const total = Math.max(0, Math.floor(xp))
  let level = 1
  while (xpForLevel(level + 1) <= total) level += 1
  return { level, into: total - xpForLevel(level), span: xpForLevel(level + 1) - xpForLevel(level) }
}

/** Share `0..1` of a part over a whole; an empty whole counts as 0, overflow as 1. */
export function fraction(part: number, whole: number): number {
  if (!(whole > 0)) return 0
  return Math.min(1, Math.max(0, part / whole))
}

/** Rounded percent `0..100` of a part over a whole. */
export function percent(part: number, whole: number): number {
  return Math.round(fraction(part, whole) * 100)
}

/** Whole days from `today` to `endsOn` (both ISO dates); negative once it has passed. */
export function daysLeft(endsOn: string, today: string): number {
  const ms = Date.parse(`${endsOn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

/** Today's ISO date in Tashkent, the school's time zone. */
export function tashkentToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(now)
}

/** ISO weekday 1 (Mon) .. 7 (Sun) of an ISO date. */
export function isoWeekday(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return day === 0 ? 7 : day
}

export const THRESHOLD_MIN = 50
export const THRESHOLD_MAX = 100
export const THRESHOLD_STEP = 5
export const THRESHOLD_DEFAULT = 80

/** Snaps a slider value to the allowed unlock threshold. */
export function snapThreshold(value: number): number {
  const snapped = Math.round(value / THRESHOLD_STEP) * THRESHOLD_STEP
  return Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, snapped))
}

export const RATINGS: readonly { rating: ReviewGradeRating; key: "again" | "hard" | "good" | "easy" }[] = [
  { rating: 1, key: "again" },
  { rating: 2, key: "hard" },
  { rating: 3, key: "good" },
  { rating: 4, key: "easy" },
]

export const GOAL_KINDS: readonly QuestGoalKind[] = ["steps", "xp", "review_days"]

/** Sensible targets for a new quest of a goal kind (per learner). */
export const GOAL_DEFAULT_TARGET: Record<QuestGoalKind, number> = { steps: 10, xp: 200, review_days: 5 }

export type QuestProblem = "title" | "target" | "classTarget" | "dates"

/** What is wrong with a quest form, empty when it can be saved. */
export function questProblems(body: QuestBody): QuestProblem[] {
  const problems: QuestProblem[] = []
  if (body.title.trim() === "") problems.push("title")
  if (!Number.isInteger(body.target) || body.target < 1) problems.push("target")
  if (!Number.isInteger(body.class_target) || body.class_target < 1) problems.push("classTarget")
  if (body.starts_on === "" || body.ends_on === "" || body.ends_on < body.starts_on) problems.push("dates")
  return problems
}

/** A blank quest for the week starting `today`. */
export function newQuest(today: string): QuestBody {
  const end = new Date(`${today}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + 7)
  return {
    title: "",
    goal_kind: "steps",
    target: GOAL_DEFAULT_TARGET.steps,
    class_target: 10,
    starts_on: today,
    ends_on: end.toISOString().slice(0, 10),
  }
}
