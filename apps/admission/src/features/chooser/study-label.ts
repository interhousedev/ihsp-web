import type { StudyGroup } from "./types"

const LOWER_WORDS = new Set(["a", "an", "and", "as", "at", "for", "in", "of", "on", "or", "the", "to", "with"])

/** First letter upper-cased, the rest as it is. */
function capitalize(word: string): string {
  return word.charAt(0).toLocaleUpperCase() + word.slice(1)
}

/**
 * A readable label of a field of study. The taxonomy keeps unknown spellings as typed ("business and technology"):
 * a label with no capital letter gets title case in English (small words stay lower) and a leading capital in the other
 * languages; a label that already has capitals is kept.
 */
export function normalizeFieldLabel(label: string, locale: string): string {
  const text = label.trim().replace(/\s+/g, " ")
  if (!text || text !== text.toLocaleLowerCase()) return text
  if (locale !== "en") return capitalize(text)
  return text
    .split(" ")
    .map((word, index) => (index > 0 && LOWER_WORDS.has(word) ? word : capitalize(word)))
    .join(" ")
}

/** The groups with normalized labels; an entry whose normalized label repeats an earlier one is dropped. */
export function normalizeStudyGroups(groups: StudyGroup[], locale: string): StudyGroup[] {
  const seen = new Set<string>()
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => ({ ...item, label: normalizeFieldLabel(item.label, locale) }))
        .filter((item) => {
          const key = item.label.toLocaleLowerCase()
          if (!key || seen.has(key)) return false
          seen.add(key)
          return true
        }),
    }))
    .filter((group) => group.items.length > 0)
}
