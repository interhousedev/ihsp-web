import type { ReviewRating } from "@ihsp/api"

// A port of `backend/app/shared/srs.py` for sessions that are not saved (the share viewer): the same learning steps,
// graduating and easy intervals, ease and interval labels, so a shared set feels like the real thing.

export type LocalCardState = "new" | "learning" | "review" | "relearning"

export type LocalSrs = {
  state: LocalCardState
  step: number
  /** Epoch milliseconds, `null` while the card is new. */
  dueAt: number | null
  intervalDays: number
  ease: number
}

const MINUTE = 60_000
const DAY = 86_400_000
const LEARNING_STEPS = [MINUTE, 10 * MINUTE]
const RELEARNING_STEP = 10 * MINUTE
const GRADUATING_INTERVAL_DAYS = 1
const EASY_INTERVAL_DAYS = 4
const START_EASE = 2.5
const MIN_EASE = 1.3
const MAX_INTERVAL_DAYS = 36500

export const NEW_SRS: LocalSrs = { state: "new", step: 0, dueAt: null, intervalDays: 0, ease: START_EASE }

function graduate(card: LocalSrs, days: number, now: number): LocalSrs {
  return { ...card, state: "review", step: 0, intervalDays: days, dueAt: now + days * DAY }
}

function learning(card: LocalSrs, rating: ReviewRating, now: number): LocalSrs {
  if (rating === "easy") return graduate(card, EASY_INTERVAL_DAYS, now)
  const step = rating === "again" ? 0 : rating === "hard" ? card.step : card.step + 1
  const delay = LEARNING_STEPS[step]
  if (delay === undefined) return graduate(card, GRADUATING_INTERVAL_DAYS, now)
  return { ...card, state: "learning", step, dueAt: now + delay }
}

function relearning(card: LocalSrs, rating: ReviewRating, now: number): LocalSrs {
  if (rating === "again") return { ...card, dueAt: now + RELEARNING_STEP }
  const days = Math.max(1, card.intervalDays)
  return { ...card, state: "review", intervalDays: days, dueAt: now + days * DAY }
}

function review(card: LocalSrs, rating: ReviewRating, now: number): LocalSrs {
  if (rating === "again") {
    return {
      ...card,
      state: "relearning",
      step: 0,
      ease: Math.max(MIN_EASE, card.ease - 0.2),
      intervalDays: Math.max(1, card.intervalDays * 0.5),
      dueAt: now + RELEARNING_STEP,
    }
  }
  let ease = card.ease
  let days = card.intervalDays * card.ease
  if (rating === "hard") {
    ease = Math.max(MIN_EASE, card.ease - 0.15)
    days = card.intervalDays * 1.2
  } else if (rating === "easy") {
    ease = card.ease + 0.15
    days = card.intervalDays * card.ease * 1.3
  }
  days = Math.min(MAX_INTERVAL_DAYS, Math.max(1, days))
  return { ...card, ease, intervalDays: days, dueAt: now + days * DAY }
}

/** The state after answering a card. */
export function answerCard(card: LocalSrs, rating: ReviewRating, now: number): LocalSrs {
  if (card.state === "new" || card.state === "learning") return learning(card, rating, now)
  if (card.state === "relearning") return relearning(card, rating, now)
  return review(card, rating, now)
}

/** "1m", "10m", "5h", "4d", "2mo": the same labels as the backend's study screen. */
export function formatDelay(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m`
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 30 * 86_400) return `${Math.floor(seconds / 86_400)}d`
  return `${Math.floor(seconds / (30 * 86_400))}mo`
}

export type LocalIntervals = Record<ReviewRating, string>

/** When the card would come back after each button. */
export function previewIntervals(card: LocalSrs, now: number): LocalIntervals {
  const label = (rating: ReviewRating) => formatDelay((answerCard(card, rating, now).dueAt ?? now) - now)
  return { again: label("again"), hard: label("hard"), medium: label("medium"), easy: label("easy") }
}
