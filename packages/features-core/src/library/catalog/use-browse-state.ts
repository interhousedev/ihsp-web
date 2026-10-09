"use client"

import type { ItemsParams, ItemType } from "@ihsp/api"
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
  type UseQueryStatesReturn,
} from "nuqs"
import { useMemo } from "react"

export const BROWSE_SOURCES = ["all", "book", "material", "external"] as const
const SORTS = ["relevance", "newest", "title", "author"] as const
const UPLOADERS = ["student", "teacher"] as const
const SHELVES = ["any", "want", "reading", "done"] as const

const parsers = {
  q: parseAsString.withDefault(""),
  source: parseAsStringLiteral(BROWSE_SOURCES).withDefault("all"),
  subject: parseAsString,
  topic: parseAsString,
  year: parseAsInteger,
  type: parseAsString,
  lang: parseAsString,
  uploader: parseAsStringLiteral(UPLOADERS),
  hasText: parseAsBoolean.withDefault(false),
  shelf: parseAsStringLiteral(SHELVES),
  sort: parseAsStringLiteral(SORTS),
  collection: parseAsString,
}

export type BrowseState = {
  [K in keyof typeof parsers]: UseQueryStatesReturn<typeof parsers>[0][K]
}

/** The filters of the browse page live in the URL (shareable, back button works). */
export function useBrowseState() {
  const [state, setState] = useQueryStates(parsers)
  return [state, setState] as const
}

export const PAGE_SIZE = 24

/** The `GET /library/items` parameters for a browse state (everything but the cursor). */
export function toItemsParams(state: BrowseState): ItemsParams {
  const params: ItemsParams = { limit: PAGE_SIZE }
  if (state.q.trim()) params.q = state.q.trim()
  if (state.source !== "all") params.source = state.source
  if (state.subject) params.subject_id = state.subject
  if (state.topic) params.topic_id = state.topic
  if (state.year) params.year_of_study = state.year
  if (state.type) params.type = state.type as ItemType
  if (state.lang) params.language = state.lang
  if (state.uploader) params.uploader_role = state.uploader
  if (state.hasText) params.has_text = true
  if (state.shelf) params.shelf = state.shelf
  if (state.collection) params.collection_id = state.collection
  params.sort = state.sort ?? (state.q.trim() ? "relevance" : "newest")
  return params
}

/** Number of filters that are on (the source chips and the search box are not counted). */
export function countActiveFilters(state: BrowseState): number {
  return (
    [
      state.subject,
      state.topic,
      state.year,
      state.type,
      state.lang,
      state.uploader,
      state.shelf,
      state.collection,
    ].filter(Boolean).length + (state.hasText ? 1 : 0)
  )
}

export function useActiveFilterCount(state: BrowseState): number {
  return useMemo(() => countActiveFilters(state), [state])
}
