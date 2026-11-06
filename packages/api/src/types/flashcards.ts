// Flash cards (backend § API contract → "Flash cards (B10)" and Schemas).

import type { ReviewRating } from "./common"

export type FlashcardHardness = "easy" | "medium" | "hard"

/** Answers on one card: Again is incorrect, every other button correct. */
export type FlashcardCardStats = {
  card_id: string
  front: string
  hardness: FlashcardHardness
  attempts: number
  correct: number
  incorrect: number
  last_studied_at: string | null
}

export type FlashcardMergeBody = { set_ids: string[]; title: string; description?: string }
export type FlashcardMergeResult = { set: FlashcardSetDetail; duplicates_skipped: number }

export type FlashcardSetItem = {
  id: string
  title: string
  description: string | null
  source: "manual" | "ai" | "mcp" | "copied"
  card_count: number
  /** Seen cards due before the day ends (learning plus review), without the daily limit. */
  due_today: number
  new_today: number
  /** The three numbers of Anki's deck list, after the daily limits: New, Learn, Due. */
  new_count: number
  learning_count: number
  due_count: number
}

/** A set in global search results: no queue counts. */
export type FlashcardSearchItem = Omit<FlashcardSetItem, "new_count" | "learning_count" | "due_count">

export type FlashcardSetDetail = FlashcardSetItem & {
  new_per_day: number
  reviews_per_day: number
  shuffle: boolean
  cards: {
    hardness: FlashcardHardness | null
    id: string
    position: number
    front: string
    back: string
    state: string
    due_at: string | null
  }[]
}

export type StudyNext = {
  set_id: string
  card: { id: string; front: string; back: string; state: string } | null
  /** Next intervals per rating, e.g. "10m", "1d". */
  intervals: { again: string; hard: string; medium: string; easy: string } | null
  counts: { learning: number; review: number; new: number }
  done_for_today: boolean
  /** A restart round: the answers change no schedule and `intervals` is null. */
  practice: boolean
  practice_remaining: number
}

export type FlashcardSetCreateBody = {
  title: string
  description?: string
  cards: { front: string; back: string; hardness?: FlashcardHardness }[]
}
export type FlashcardSetPatchBody = {
  title?: string
  description?: string
  new_per_day?: number
  reviews_per_day?: number
  shuffle?: boolean
}
/** Full ordered list; cards whose id is missing from it are deleted. */
export type FlashcardCardsBody = {
  cards: { id?: string; front: string; back: string; hardness?: FlashcardHardness }[]
}
export type FlashcardReviewBody = {
  rating: ReviewRating
  /** How long the card was on screen; the server keeps at most one minute of it. */
  duration_ms?: number
}
export type FlashcardCopyBody = { share_slug: string }

/** Query of `GET /v1/me/flashcard-sets/stats`: one set or all of them, and the heatmap year (default: this year). */
export type FlashcardStatsParams = { set_id?: string; year?: number }

/** Reviews on one study day (a Tashkent calendar day, `YYYY-MM-DD`). */
export type FlashcardStatsDay = { date: string; count: number }

/** Heatmap and numbers of Anki's deck overview. Streaks look at the whole history, the rest at `year`. */
export type FlashcardStats = {
  year: number
  set_id: string | null
  days: FlashcardStatsDay[]
  total_reviews: number
  days_studied: number
  /** Reviews per studied day. */
  daily_average: number
  /** Share of days since the first review (within `year`) that were studied, 0 to 100. */
  days_learned_percent: number
  longest_streak: number
  current_streak: number
  first_review_date: string | null
  today_count: number
  today_seconds: number
}
