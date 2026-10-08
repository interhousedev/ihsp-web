import type { ReviewRating } from "@ihsp/api"

export const RATINGS: readonly ReviewRating[] = ["again", "hard", "medium", "easy"]

/** Keys 1 to 4 rate the card in the order of the buttons. */
export function ratingForKey(key: string): ReviewRating | null {
  const index = Number(key) - 1
  return Number.isInteger(index) ? (RATINGS[index] ?? null) : null
}

/** Do not steal keys from a field the visitor is typing in. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

/**
 * Next queue after a rating: the card leaves the queue, except "again", which comes back at the end of the round.
 * Progress is kept in memory only (a shared set has no owner to save it for).
 */
export function afterRating(queue: readonly string[], rating: ReviewRating): string[] {
  const [first, ...rest] = queue
  if (first === undefined) return []
  return rating === "again" ? [...rest, first] : rest
}
