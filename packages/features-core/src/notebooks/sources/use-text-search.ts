"use client"

import { getNotebookSearchQuery, type SourceSearchGroup } from "@ihsp/api"
import { useDebounce } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { MIN_SEARCH_LENGTH } from "./constants"

/** The route allows 30 requests a minute: wait for a pause in typing and keep an answer for a while. */
const DEBOUNCE_MS = 300
const STALE_MS = 60_000
const HIT_LIMIT = 20

export type TextSearch = {
  /** The sources whose text contains the words, with up to 3 passages each; empty on any failure. */
  groups: readonly SourceSearchGroup[]
  /** A search is waiting for the typing to pause or for the answer. */
  pending: boolean
}

/**
 * `GET /notebooks/{id}/search?q=` for the typed text (two or more characters, after a 300 ms pause). A failure, such
 * as the rate limit, just leaves the group out.
 */
export function useTextSearch(notebookId: string, text: string): TextSearch {
  const query = text.trim()
  const settled = useDebounce(query, DEBOUNCE_MS)
  const answer = useQuery({
    ...getNotebookSearchQuery(notebookId, { q: settled, limit: HIT_LIMIT }),
    enabled: settled.length >= MIN_SEARCH_LENGTH,
    staleTime: STALE_MS,
    retry: false,
  })
  const wanted = query.length >= MIN_SEARCH_LENGTH
  const current = wanted && settled === query
  return {
    groups: current && answer.isSuccess ? answer.data.sources : [],
    pending: wanted && (!current || answer.isPending),
  }
}
