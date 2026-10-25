import type { PdfDocumentHandle } from "./pdf-types"
import { findInText } from "./translit"

export type PdfSearchHit = {
  page: number
  excerpt: { pre: string; match: string; post: string }
}

const CONTEXT = 40
const PER_PAGE = 20
export const MAX_PDF_HITS = 200

/**
 * Searches the text of every page in order and yields the hits as they are found, so the first results show at once
 * even in a 1000-page book. The query and the text are normalised the same way, so for Uzbek the Cyrillic and Latin
 * spellings meet (`lib/translit.ts`). Stops after `MAX_PDF_HITS` hits or when `signal` aborts.
 */
export async function* searchPdf(
  doc: PdfDocumentHandle,
  query: string,
  language: string,
  signal: AbortSignal,
): AsyncGenerator<PdfSearchHit> {
  let total = 0
  for (let number = 1; number <= doc.pageCount; number += 1) {
    if (signal.aborted || total >= MAX_PDF_HITS) return
    const page = await doc.getPage(number)
    let text: string
    try {
      text = await page.getText()
    } finally {
      page.release()
    }
    if (signal.aborted) return
    for (const hit of findInText(text, query, language, PER_PAGE)) {
      yield {
        page: number,
        excerpt: {
          pre: text.slice(Math.max(0, hit.start - CONTEXT), hit.start).replaceAll(/\s+/g, " "),
          match: text.slice(hit.start, hit.end),
          post: text.slice(hit.end, hit.end + CONTEXT).replaceAll(/\s+/g, " "),
        },
      }
      total += 1
      if (total >= MAX_PDF_HITS) return
    }
  }
}
