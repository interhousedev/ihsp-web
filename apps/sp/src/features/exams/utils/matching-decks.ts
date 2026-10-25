import type { FlashcardSetItem } from "@ihsp/api"

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Decks have no link to a subject, so a deck belongs to a subject when its title contains the subject's name (anywhere,
 * ignoring case) or its short name (as a whole word, ignoring case). A short name of one or two letters is an acronym
 * ("IT"), so it must match exactly: it would otherwise match every title with the word "it".
 */
export function decksForSubject(
  decks: FlashcardSetItem[],
  subject: { name: string; short_name: string },
): FlashcardSetItem[] {
  const name = subject.name.trim().toLowerCase()
  const shortName = subject.short_name.trim()
  const shortWord = shortName
    ? new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(shortName)}(?![\\p{L}\\p{N}])`, shortName.length < 3 ? "u" : "iu")
    : null
  return decks.filter((deck) => (name !== "" && deck.title.toLowerCase().includes(name)) || shortWord?.test(deck.title))
}
