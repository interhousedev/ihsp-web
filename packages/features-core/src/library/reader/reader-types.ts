import type { ItemDetail, ItemFile, TocEntry } from "@ihsp/api"
import type { Ref } from "react"
import type { FileLinks } from "./lib/file-link"
import type { Locator } from "./lib/locator"
import type { ReaderSettings } from "./lib/reader-settings"
import type { ViewAnnotation } from "./use-reader-annotations"

// The contract between the reader frame (toolbar, panels, keys, annotations) and the three views (PDF, EPUB, text).
// A view draws one file and reports where it is; the frame never touches its internals.

/** Where the reader is. `label` is the chapter, when the format knows it. */
export type ReaderPosition = {
  locator: Locator
  /** 0 to 1 over the whole item. */
  fraction: number
  label: string | null
  /** PDF: the current page. EPUB: the page inside the chapter, when paginated. */
  page: number | null
  pages: number | null
}

/** A selection of text in a view, with the locator an annotation made from it gets. */
export type ReaderSelection = {
  text: string
  rect: { left: number; top: number; width: number; height: number }
  locator: Locator
  /** PDF page of the selection (for "Add to notebook"). */
  page: number | null
}

export type SearchHit = {
  id: string
  /** PDF: the page. */
  page: number | null
  /** EPUB: the CFI. */
  cfi: string | null
  label: string | null
  excerpt: { pre: string; match: string; post: string }
}

/** A contents entry as the views navigate it: a page, or an href of the EPUB. */
export type ReaderTocEntry = { title: string; level: number; page: number | null; href: string | null }

/** What the frame can ask a view to do. */
export interface ReaderHandle {
  next(): void
  prev(): void
  first(): void
  last(): void
  goToLocator(locator: Locator): void
  goToToc(entry: ReaderTocEntry): void
  /** Formats with pages (PDF): jump to a page. */
  goToPage?(page: number): void
  zoomIn?(): void
  zoomOut?(): void
  /** In-item search; the iterable ends when everything was searched or `signal` aborted. */
  search?(query: string, signal: AbortSignal): AsyncIterable<SearchHit>
  showHit?(hit: SearchHit): void
  clearSearch?(): void
  /** The contents the view found in the file itself (PDF outline, EPUB navigation), when the server has none. */
  loadToc?(): Promise<ReaderTocEntry[]>
}

export type ReaderViewProps = {
  item: ItemDetail
  file: ItemFile
  links: FileLinks
  /** Where to open; `null` for the start. */
  start: Locator | null
  /** The fraction to open at when there is no locator (the percent the server knows). */
  startFraction?: number | null
  annotations: readonly ViewAnnotation[]
  settings: ReaderSettings
  /** The Uzbek search normalisation applies to `uz_latn` and `uz_cyrl` items. */
  language: string
  onPosition(position: ReaderPosition): void
  onSelection(selection: ReaderSelection | null): void
  onAnnotationClick(id: string): void
  onReady(info: { pages: number | null; title: string | null }): void
  onError(error: unknown): void
  /** The reader handle; set when the view is ready. */
  ref?: Ref<ReaderHandle>
}

/** The contents of the file as the server knows them (`files[].toc`), as view entries. */
export function tocFromFile(toc: readonly TocEntry[]): ReaderTocEntry[] {
  return toc.map((entry) => ({
    title: entry.title,
    level: entry.level,
    page: entry.page ?? null,
    href: entry.href ?? null,
  }))
}

/** `uz_latn` and `uz_cyrl` are Uzbek (searched in either script); everything else is matched as it is. */
export function searchLanguage(language: string): string {
  return language.toLowerCase().startsWith("uz") ? "uz" : "other"
}
