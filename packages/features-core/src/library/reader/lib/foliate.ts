// The parts of foliate-js (https://github.com/johnfactotum/foliate-js, pinned in package.json) that `epub-engine.ts`
// uses, with types. The library ships plain JavaScript without declarations, so every import below is an untyped module
// that is given its types here once; the rest of the code imports from this file only. Import this file only through
// `epub-engine.ts` (it is loaded dynamically), because it loads foliate-js.

/* eslint-disable */
// @ts-expect-error -- foliate-js ships no declarations
import * as epubModule from "foliate-js/epub.js"
// @ts-expect-error -- foliate-js ships no declarations
import * as cfiModule from "foliate-js/epubcfi.js"
// @ts-expect-error -- foliate-js ships no declarations
import * as overlayerModule from "foliate-js/overlayer.js"
// @ts-expect-error -- foliate-js ships no declarations
import * as progressModule from "foliate-js/progress.js"
// @ts-expect-error -- foliate-js ships no declarations
import * as zipModule from "foliate-js/vendor/zip.js"
// Registers the `<foliate-paginator>` element.
import "foliate-js/paginator.js"

export type FoliateTocItem = { label: string; href: string; subitems?: FoliateTocItem[] }
export type FoliateResolved = { index: number; anchor: (doc: Document) => Range | Element | null }
export type FoliateSection = {
  id: string | number
  linear?: string
  size: number
  cfi?: string
  load(): Promise<string> | string
  unload?(): void
  createDocument?(): Promise<Document> | Document
  resolveHref?(href: string): string
}
export type FoliateLoader = {
  loadText(name: string): Promise<string | null> | string | null
  loadBlob(name: string, type?: string): Promise<Blob | null> | Blob | null
  getSize(name: string): number
}

export interface FoliateBook {
  init(): Promise<FoliateBook>
  metadata: { title?: string | Record<string, string>; language?: string | string[] }
  toc?: FoliateTocItem[]
  sections: FoliateSection[]
  dir?: string
  rendition?: { layout?: string }
  transformTarget?: EventTarget
  splitTOCHref(href: string): Promise<[string | number, unknown]>
  getTOCFragment(doc: Document, id: unknown): Node | null
  resolveHref(href: string): FoliateResolved
  resolveCFI(cfi: string): FoliateResolved
  isExternal(href: string): boolean
}
export const EPUB = epubModule.EPUB as new (loader: FoliateLoader) => FoliateBook

type Rects = DOMRectList | DOMRect[]
export type DrawFunction = (rects: Rects, options?: Record<string, unknown>) => SVGElement
export interface FoliateOverlayer {
  element: SVGElement
  add(key: string, range: Range, draw: DrawFunction, options?: Record<string, unknown>): void
  remove(key: string): void
  redraw(): void
  hitTest(event: MouseEvent): [string | undefined, Range | undefined]
}
export const Overlayer = overlayerModule.Overlayer as (new () => FoliateOverlayer) & {
  highlight: DrawFunction
  outline: DrawFunction
  underline: DrawFunction
}

export const CFI = cfiModule as {
  isCFI: RegExp
  fromRange(range: Range, filter?: unknown): string
  joinIndir(...parts: string[]): string
  fake: { fromIndex(index: number): string }
}

export interface FoliateTocProgress {
  init(options: {
    toc: FoliateTocItem[]
    ids: (string | number)[]
    splitHref: (href: string) => Promise<[string | number, unknown]>
    getFragment: (doc: Document, id: unknown) => Node | null
  }): Promise<void>
  getProgress(index: number, range?: Range): FoliateTocItem | null | undefined
}
export interface FoliateSectionProgress {
  getProgress(index: number, fractionInSection: number, pageFraction?: number): { fraction: number }
  getSection(fraction: number): [number, (doc: Document) => Range | Element | null]
}
export const TOCProgress = progressModule.TOCProgress as new () => FoliateTocProgress
export const SectionProgress = progressModule.SectionProgress as new (
  sections: FoliateSection[],
  sizePerLoc: number,
  sizePerTimeUnit: number,
) => FoliateSectionProgress

export interface FoliatePaginator extends HTMLElement {
  open(book: FoliateBook): void
  goTo(target: { index: number; anchor?: unknown; select?: boolean }): Promise<void>
  prev(distance?: number): Promise<void>
  next(distance?: number): Promise<void>
  getContents(): { index: number; overlayer: FoliateOverlayer | undefined; doc: Document }[]
  setStyles(styles: string | [string, string]): void
  destroy(): void
  readonly page: number
  readonly pages: number
}

type ZipEntry = {
  filename: string
  uncompressedSize: number
  getData(writer: unknown): Promise<string | Blob>
}
export interface FoliateZip {
  configure(options: { useWebWorkers?: boolean }): void
  ZipReader: new (reader: unknown) => { getEntries(): Promise<ZipEntry[]>; close(): Promise<void> }
  BlobReader: new (blob: Blob) => unknown
  BlobWriter: new (type?: string) => unknown
  TextWriter: new () => unknown
}
export const zip = zipModule as FoliateZip
