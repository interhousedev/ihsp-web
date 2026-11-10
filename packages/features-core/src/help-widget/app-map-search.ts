import type { AppMapItem } from "@ihsp/api"

/** The title of a page in the user's language, falling back to English and then to the path. */
export function appMapTitle(item: AppMapItem, locale: string): string {
  return item.title[locale] ?? item.title.en ?? item.path
}

/**
 * Pages whose title (in any language) or keywords contain every word of the query; empty query → no result.
 * Titles that start with the query come first.
 */
export function filterAppMap(items: readonly AppMapItem[], query: string, locale: string): AppMapItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const scored: { item: AppMapItem; rank: number }[] = []
  for (const item of items) {
    const title = appMapTitle(item, locale).toLowerCase()
    const haystack = `${Object.values(item.title).join(" ")} ${item.keywords.join(" ")} ${item.path}`.toLowerCase()
    if (!words.every((word) => haystack.includes(word))) continue
    scored.push({ item, rank: title.startsWith(words[0] ?? "") ? 0 : 1 })
  }
  return scored.toSorted((a, b) => a.rank - b.rank).map((entry) => entry.item)
}

/** The pages to offer before the user types: the current app's, without its home page. */
export function quickLinks(items: readonly AppMapItem[], currentApp: string, limit = 6): AppMapItem[] {
  return items.filter((item) => item.app === currentApp && item.url !== null && item.path !== "/").slice(0, limit)
}
