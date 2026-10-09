import type { SourcesAddBody } from "@ihsp/api"

/**
 * A library item as a notebook source (docs/reference/study-library.md § 3.11): `ref {item_id, file_id, page_from?,
 * page_to?}`. The notebooks `SourceInput` type of `@ihsp/api` does not list this kind yet (the notebooks bridge on the
 * backend is a later phase), so the body is built here and cast once, at the single call site.
 */
export type LibraryItemSourceInput = {
  kind: "library_item"
  item_id: string
  file_id: string
  page_from?: number
  page_to?: number
}

export function libraryItemSource(input: {
  itemId: string
  fileId: string
  pageFrom?: number | null | undefined
  pageTo?: number | null | undefined
}): LibraryItemSourceInput {
  return {
    kind: "library_item",
    item_id: input.itemId,
    file_id: input.fileId,
    ...(input.pageFrom ? { page_from: input.pageFrom } : {}),
    ...(input.pageTo ? { page_to: input.pageTo } : {}),
  }
}

/** The one cast: the backend accepts `library_item` although the shared notebook types do not know it yet. */
export function asSourcesBody(sources: LibraryItemSourceInput[]): SourcesAddBody {
  return { items: sources } as unknown as SourcesAddBody
}

/** Parses a page field: a whole number of at least 1, or `null` when empty or invalid. */
export function parsePage(value: string): number | null {
  const number = Number(value)
  return value.trim() !== "" && Number.isInteger(number) && number >= 1 ? number : null
}
