import type { ReviewRating } from "@ihsp/api"

/** Rating order of the four buttons; keys 1 to 4 press them (WEB-23). */
export const RATINGS: readonly ReviewRating[] = ["again", "hard", "medium", "easy"]

const KEY_TO_RATING: Readonly<Record<string, ReviewRating>> = {
  "1": "again",
  "2": "hard",
  "3": "medium",
  "4": "easy",
}

/** Rating of a pressed key, or `undefined` when the key is not one of 1 to 4. */
export function ratingForKey(key: string): ReviewRating | undefined {
  return KEY_TO_RATING[key]
}

/** Keyboard events typed into a form field are never study shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}
