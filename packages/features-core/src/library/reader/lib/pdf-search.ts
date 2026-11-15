import { searchLibraryItemText, type ItemTextBox } from "@ihsp/api"

export type PdfSearchHit = {
  page: number
  excerpt: { pre: string; match: string; post: string }
  /** Where the hit sits on its page, as fractions of the page; empty when the file has no stored positions. */
  boxes: ItemTextBox[]
}

export const MAX_PDF_HITS = 200

/**
 * Asks the server for the hits in the stored page text, so no page is rendered to search it. Case, diacritics and
 * (for Uzbek) the script do not matter; the server folds the query the way it folded the text. Yields the hits in
 * page order; nothing when `signal` aborts.
 */
export async function* searchPdf(itemId: string, query: string, signal: AbortSignal): AsyncGenerator<PdfSearchHit> {
  const result = await searchLibraryItemText(itemId, { q: query, limit: MAX_PDF_HITS }, { signal })
  for (const hit of result.hits) {
    if (signal.aborted) return
    yield { page: hit.page, excerpt: hit.snippet, boxes: hit.boxes }
  }
}
