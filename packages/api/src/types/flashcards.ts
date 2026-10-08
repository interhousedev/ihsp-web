// Flash cards (backend § API contract → "Flash cards (B10)" and Schemas).

import type { ReviewRating } from "./common"

export type FlashcardSetItem = {
  id: string
  title: string
  description: string | null
  source: "manual" | "ai" | "mcp" | "copied"
  card_count: number
  due_today: number
  new_today: number
}

export type FlashcardSetDetail = FlashcardSetItem & {
  new_per_day: number
  reviews_per_day: number
  cards: {
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
}

export type FlashcardSetCreateBody = {
  title: string
  description?: string
  cards: { front: string; back: string }[]
}
export type FlashcardSetPatchBody = {
  title?: string
  description?: string
  new_per_day?: number
  reviews_per_day?: number
}
/** Full ordered list; cards whose id is missing from it are deleted. */
export type FlashcardCardsBody = { cards: { id?: string; front: string; back: string }[] }
export type FlashcardReviewBody = { rating: ReviewRating }
export type FlashcardCopyBody = { share_slug: string }
