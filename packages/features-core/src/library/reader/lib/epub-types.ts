import type { AnnotationColor } from "@ihsp/api"

// What the EPUB reader needs from an EPUB library. `epub-engine.ts` implements it with foliate-js (loaded dynamically);
// the tests pass a small fake, because happy-dom cannot lay out columns inside an iframe.

export type EpubTocEntry = { title: string; href: string; level: number }

/** Where the reader is: the CFI of the start of the visible text and the fraction of the whole book. */
export type EpubLocation = {
  cfi: string
  /** 0 to 1 over the whole book. */
  fraction: number
  /** Title of the contents entry the position is in. */
  chapter: string | null
  /** Page of the visible section when the book is paginated. */
  page: number | null
  pages: number | null
}

/** A selection inside the book. `rect` is in the coordinates of the app window (the iframe offset is added). */
export type EpubSelection = {
  cfi: string
  text: string
  rect: { left: number; top: number; width: number; height: number }
}

export type EpubMark = { id: string; cfi: string; color: AnnotationColor; kind: "highlight" | "note" | "bookmark" }

export type EpubStyle = {
  /** CSS colours resolved from the app's theme, so the book follows light and dark. */
  foreground: string
  background: string
  link: string
  /** Percent of the base size. */
  fontSize: number
  lineHeight: number
  flow: "paginated" | "scrolled"
}

export type EpubSearchHit = {
  cfi: string
  excerpt: { pre: string; match: string; post: string }
  chapter: string | null
}

export type EpubHandlers = {
  onRelocate(location: EpubLocation): void
  /** `null` when the selection was cleared. */
  onSelection(selection: EpubSelection | null): void
  onMarkClick(id: string): void
  onError(error: unknown): void
}

export interface EpubHandle {
  readonly toc: EpubTocEntry[]
  readonly title: string | null
  goTo(target: string): Promise<void>
  goToFraction(fraction: number): Promise<void>
  next(): Promise<void>
  prev(): Promise<void>
  setStyle(style: EpubStyle): void
  setMarks(marks: readonly EpubMark[]): void
  /** In-book search; matches Cyrillic and Latin Uzbek alike when `language` is `uz`. Cancels when `signal` aborts. */
  search(query: string, language: string, signal: AbortSignal): AsyncIterable<EpubSearchHit>
  /** Moves the view to a search hit and flashes it. */
  showHit(cfi: string): Promise<void>
  clearSearch(): void
  /** The text of the current selection, for Copy. */
  selectedText(): string
  clearSelection(): void
  destroy(): void
}

export type EpubOpenOptions = {
  file: Blob
  host: HTMLElement
  style: EpubStyle
  /** A CFI to open at, a fraction of the book, or nothing for the start. */
  start: { cfi: string } | { fraction: number } | null
  handlers: EpubHandlers
}

export interface EpubEngine {
  open(options: EpubOpenOptions): Promise<EpubHandle>
}

export type EpubEngineLoader = () => Promise<EpubEngine>
