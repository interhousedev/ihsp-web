import {
  CFI,
  EPUB,
  Overlayer,
  SectionProgress,
  TOCProgress,
  zip,
  type FoliateBook,
  type FoliateOverlayer,
  type FoliatePaginator,
  type FoliateSection,
  type FoliateTocItem,
} from "./foliate"
import { EPUB_FILL } from "./colors"
import type {
  EpubEngine,
  EpubHandle,
  EpubHandlers,
  EpubMark,
  EpubOpenOptions,
  EpubSearchHit,
  EpubStyle,
  EpubTocEntry,
} from "./epub-types"
import { collectText, rangeFromOffsets } from "./quote-range"
import { findInText } from "./translit"

// The foliate-js engine. Import this file only dynamically (`load-engines.ts`). It uses foliate's EPUB parser, paginator
// (CSS columns inside a sandboxed iframe), overlayer (highlights) and progress modules directly instead of its `view.js`,
// which would also pull in the MOBI, FB2, comic-book and pdf.js adapters (several MB the reader never uses).
//
// Security: foliate renders chapters from `blob:` URLs of our own origin and must keep `allow-same-origin` and
// `allow-scripts` on its iframes (a WebKit bug), so the sandbox cannot stop a script in a book. Two things do: the
// page policy (`script-src 'self'` plus hashes) blocks inline scripts and blob scripts, and this file tells foliate to
// skip every script resource of the book (`load` event with `isScript`).

const OPEN_LINK_SCHEMES = new Set(["http:", "https:", "mailto:"])
const HIT_CONTEXT = 40
const MAX_HITS_PER_SECTION = 50

type ContentSlot = { index: number; overlayer: FoliateOverlayer | undefined; doc: Document }

function titleOf(title: unknown): string | null {
  if (typeof title === "string") return title
  if (title && typeof title === "object") return Object.values(title as Record<string, string>)[0] ?? null
  return null
}

function flattenToc(items: FoliateTocItem[] | undefined, level = 0, out: EpubTocEntry[] = []): EpubTocEntry[] {
  for (const item of items ?? []) {
    out.push({ title: item.label.trim(), href: item.href, level })
    flattenToc(item.subitems, level + 1, out)
  }
  return out
}

async function openZip(file: Blob) {
  zip.configure({ useWebWorkers: false })
  const reader = new zip.ZipReader(new zip.BlobReader(file))
  const entries = await reader.getEntries()
  const byName = new Map(entries.map((entry) => [entry.filename, entry]))
  return {
    close: () => reader.close(),
    loader: {
      loadText: async (name: string) => {
        const entry = byName.get(name)
        return entry ? ((await entry.getData(new zip.TextWriter())) as string) : null
      },
      loadBlob: async (name: string, type?: string) => {
        const entry = byName.get(name)
        return entry ? ((await entry.getData(new zip.BlobWriter(type))) as Blob) : null
      },
      getSize: (name: string) => byName.get(name)?.uncompressedSize ?? 0,
    },
  }
}

function css(style: EpubStyle): string {
  return `
    html { color: ${style.foreground} !important; background: ${style.background} !important; font-size: ${style.fontSize}% !important; --overlayer-highlight-opacity: .4; }
    body { color: ${style.foreground} !important; background: transparent !important; }
    body, p, li, blockquote, dd, dt, div { line-height: ${style.lineHeight} !important; }
    a:link, a:visited { color: ${style.link} !important; }
    p, li, blockquote, dd { hyphens: auto; -webkit-hyphens: auto; overflow-wrap: break-word; }
    pre { white-space: pre-wrap !important; tab-size: 2; }
    img, svg, video { max-width: 100%; height: auto; }
    ::selection { background: ${style.link}; color: ${style.background}; }
  `
}

class Engine implements EpubHandle {
  readonly toc: EpubTocEntry[]
  readonly title: string | null
  readonly #book: FoliateBook
  readonly #renderer: FoliatePaginator
  readonly #host: HTMLElement
  readonly #handlers: EpubHandlers
  readonly #sections: InstanceType<typeof SectionProgress>
  readonly #tocProgress: InstanceType<typeof TOCProgress>
  readonly #close: () => Promise<void>
  #style: EpubStyle
  #marks: EpubMark[] = []
  #drawn = new Set<string>()
  #searchKeys = new Set<string>()
  #selectionTimer: ReturnType<typeof setTimeout> | null = null
  #destroyed = false

  constructor(parts: {
    book: FoliateBook
    renderer: FoliatePaginator
    host: HTMLElement
    handlers: EpubHandlers
    sections: InstanceType<typeof SectionProgress>
    tocProgress: InstanceType<typeof TOCProgress>
    style: EpubStyle
    close: () => Promise<void>
  }) {
    this.#book = parts.book
    this.#renderer = parts.renderer
    this.#host = parts.host
    this.#handlers = parts.handlers
    this.#sections = parts.sections
    this.#tocProgress = parts.tocProgress
    this.#style = parts.style
    this.#close = parts.close
    this.toc = flattenToc(parts.book.toc)
    this.title = titleOf(parts.book.metadata.title)

    const renderer = parts.renderer
    renderer.addEventListener("load", (event) =>
      this.#onLoad((event as CustomEvent<{ doc: Document; index: number }>).detail),
    )
    renderer.addEventListener("relocate", (event) =>
      this.#onRelocate((event as CustomEvent<{ index: number; range: Range; fraction: number; size?: number }>).detail),
    )
    renderer.addEventListener("create-overlayer", (event) => {
      const detail = (
        event as CustomEvent<{ doc: Document; index: number; attach: (overlayer: FoliateOverlayer) => void }>
      ).detail
      const overlayer = new Overlayer()
      detail.doc.addEventListener("click", (click) => {
        const [key] = overlayer.hitTest(click as MouseEvent)
        if (key && !this.#searchKeys.has(key)) this.#handlers.onMarkClick(key)
      })
      detail.attach(overlayer)
      queueMicrotask(() => this.#drawMarks())
    })
  }

  // - - - Events from the paginator - - -

  #getCFI(index: number, range?: Range): string {
    const base = this.#book.sections[index]?.cfi ?? CFI.fake.fromIndex(index)
    return range ? CFI.joinIndir(base, CFI.fromRange(range)) : base
  }

  #onLoad({ doc, index }: { doc: Document; index: number }): void {
    this.#renderer.setStyles(css(this.#style))
    doc.documentElement.lang ||= titleOf(this.#book.metadata.language) ?? ""
    doc.addEventListener("click", (event) => this.#onLinkClick(event, index))
    doc.addEventListener("selectionchange", () => this.#scheduleSelection(doc, index))
    doc.addEventListener("keydown", (event) => {
      // Keys typed inside the book do not bubble out of its iframe: hand them to the reader.
      const forwarded = new KeyboardEvent("keydown", {
        key: event.key,
        code: event.code,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        bubbles: true,
        cancelable: true,
      })
      if (!this.#host.dispatchEvent(forwarded)) event.preventDefault()
    })
  }

  #onLinkClick(event: Event, index: number): void {
    const anchor = (event.target as Element | null)?.closest("a[href]")
    if (!anchor) return
    event.preventDefault()
    const raw = anchor.getAttribute("href") ?? ""
    const section = this.#book.sections[index] as FoliateSection & { resolveHref?: (href: string) => string }
    const href = section.resolveHref?.(raw) ?? raw
    if (this.#book.isExternal(href)) {
      try {
        const url = new URL(raw)
        if (OPEN_LINK_SCHEMES.has(url.protocol)) window.open(url.href, "_blank", "noopener,noreferrer")
      } catch {
        // A link that is not a valid address does nothing.
      }
      return
    }
    void this.goTo(href).catch((error: unknown) => this.#handlers.onError(error))
  }

  #onRelocate({
    index,
    range,
    fraction,
    size,
  }: {
    index: number
    range: Range
    fraction: number
    size?: number
  }): void {
    const progress = this.#sections.getProgress(index, fraction, size ?? 0)
    const chapter = this.#tocProgress.getProgress(index, range)?.label ?? null
    this.#handlers.onRelocate({
      cfi: this.#getCFI(index, range),
      fraction: progress.fraction,
      chapter: chapter?.trim() || null,
      page: this.#renderer.pages > 2 ? this.#renderer.page : null,
      pages: this.#renderer.pages > 2 ? this.#renderer.pages - 2 : null,
    })
  }

  #scheduleSelection(doc: Document, index: number): void {
    if (this.#selectionTimer) clearTimeout(this.#selectionTimer)
    // `selectionchange` fires on every handle move: report once the selection settles.
    this.#selectionTimer = setTimeout(() => {
      const selection = doc.getSelection()
      const text = selection?.toString().trim() ?? ""
      if (!selection || selection.isCollapsed || !text || selection.rangeCount === 0) {
        this.#handlers.onSelection(null)
        return
      }
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const frame = doc.defaultView?.frameElement?.getBoundingClientRect()
      this.#handlers.onSelection({
        cfi: this.#getCFI(index, range),
        text,
        rect: {
          left: rect.left + (frame?.left ?? 0),
          top: rect.top + (frame?.top ?? 0),
          width: rect.width,
          height: rect.height,
        },
      })
    }, 120)
  }

  // - - - Marks (highlights and notes) - - -

  #contents(): ContentSlot[] {
    return this.#renderer.getContents() as ContentSlot[]
  }

  #drawMarks(): void {
    if (this.#destroyed) return
    for (const slot of this.#contents()) {
      if (!slot.overlayer) continue
      for (const key of this.#drawn) slot.overlayer.remove(key)
      for (const mark of this.#marks) {
        if (mark.kind === "bookmark") continue
        try {
          const resolved = this.#book.resolveCFI(mark.cfi)
          if (resolved.index !== slot.index) continue
          const anchor = resolved.anchor(slot.doc)
          if (!(anchor instanceof Range)) continue
          slot.overlayer.add(mark.id, anchor, Overlayer.highlight, { color: EPUB_FILL[mark.color] })
        } catch {
          // A CFI that no longer fits the book (a different edition) is simply not drawn.
        }
      }
    }
    this.#drawn = new Set(this.#marks.filter((mark) => mark.kind !== "bookmark").map((mark) => mark.id))
  }

  setMarks(marks: readonly EpubMark[]): void {
    this.#marks = [...marks]
    this.#drawMarks()
  }

  // - - - Navigation - - -

  async goTo(target: string): Promise<void> {
    const resolved = CFI.isCFI.test(target) ? this.#book.resolveCFI(target) : this.#book.resolveHref(target)
    await this.#renderer.goTo(resolved)
  }

  async goToFraction(fraction: number): Promise<void> {
    const [index, anchor] = this.#sections.getSection(fraction)
    await this.#renderer.goTo({ index, anchor })
  }

  next(): Promise<void> {
    return this.#renderer.next()
  }

  prev(): Promise<void> {
    return this.#renderer.prev()
  }

  setStyle(style: EpubStyle): void {
    this.#style = style
    this.#renderer.setAttribute("flow", style.flow)
    this.#renderer.setStyles(css(style))
  }

  // - - - Search - - -

  async *search(query: string, language: string, signal: AbortSignal): AsyncGenerator<EpubSearchHit> {
    this.clearSearch()
    for (const [index, section] of this.#book.sections.entries()) {
      if (signal.aborted) return
      if (!section.createDocument) continue
      const doc = await section.createDocument()
      if (!doc.body) continue
      const collected = collectText(doc.body)
      for (const hit of findInText(collected.full, query, language, MAX_HITS_PER_SECTION)) {
        const range = rangeFromOffsets(collected, hit.start, hit.end, doc)
        if (!range) continue
        const chapter = this.#tocProgress.getProgress(index, range)?.label ?? null
        yield {
          cfi: this.#getCFI(index, range),
          chapter: chapter?.trim() || null,
          excerpt: {
            pre: collected.full.slice(Math.max(0, hit.start - HIT_CONTEXT), hit.start),
            match: collected.full.slice(hit.start, hit.end),
            post: collected.full.slice(hit.end, hit.end + HIT_CONTEXT),
          },
        }
      }
    }
  }

  async showHit(cfi: string): Promise<void> {
    this.clearSearch()
    await this.goTo(cfi)
    const resolved = this.#book.resolveCFI(cfi)
    const slot = this.#contents().find((content) => content.index === resolved.index)
    const anchor = slot ? resolved.anchor(slot.doc) : null
    if (slot?.overlayer && anchor instanceof Range) {
      const key = `search:${cfi}`
      slot.overlayer.add(key, anchor, Overlayer.outline, { color: this.#style.link })
      this.#searchKeys.add(key)
    }
  }

  clearSearch(): void {
    for (const slot of this.#contents()) for (const key of this.#searchKeys) slot.overlayer?.remove(key)
    this.#searchKeys.clear()
  }

  // - - - Selection - - -

  selectedText(): string {
    return this.#contents()[0]?.doc.getSelection()?.toString() ?? ""
  }

  clearSelection(): void {
    for (const slot of this.#contents()) slot.doc.getSelection()?.removeAllRanges()
    this.#handlers.onSelection(null)
  }

  destroy(): void {
    if (this.#destroyed) return
    this.#destroyed = true
    if (this.#selectionTimer) clearTimeout(this.#selectionTimer)
    try {
      this.#renderer.destroy()
    } catch {
      // No chapter was ever shown: there is no view to destroy.
    }
    this.#renderer.remove()
    void this.#close().catch(() => undefined)
  }
}

async function openEpub(options: EpubOpenOptions): Promise<EpubHandle> {
  const { file, host, style, start, handlers } = options
  const archive = await openZip(file)
  const book = await new EPUB(archive.loader).init()
  if (book.rendition?.layout === "pre-paginated") {
    await archive.close()
    throw new Error("fixed-layout")
  }
  // Scripts in a book are never run (see the note at the top).
  book.transformTarget?.addEventListener("load", (event) => {
    const detail = (event as CustomEvent<{ isScript?: boolean; allow?: boolean }>).detail
    if (detail.isScript) detail.allow = false
  })

  const sections = new SectionProgress(book.sections, 1500, 1600)
  const tocProgress = new TOCProgress()
  const ids = book.sections.map((section) => section.id)
  const splitHref = book.splitTOCHref.bind(book)
  const getFragment = book.getTOCFragment.bind(book)
  await tocProgress.init({ toc: book.toc ?? [], ids, splitHref, getFragment })

  const renderer = document.createElement("foliate-paginator") as FoliatePaginator
  renderer.setAttribute("flow", style.flow)
  renderer.setAttribute("margin", "24")
  renderer.setAttribute("gap", "6%")
  renderer.setAttribute("max-inline-size", "720px")
  renderer.open(book)
  host.append(renderer)

  const engine = new Engine({ book, renderer, host, handlers, sections, tocProgress, style, close: archive.close })
  try {
    if (start && "cfi" in start && CFI.isCFI.test(start.cfi)) await engine.goTo(start.cfi)
    else if (start && "fraction" in start) await engine.goToFraction(start.fraction)
    else await renderer.next()
  } catch (error) {
    // A position from another edition of the book: open at the start instead of failing.
    handlers.onError(error)
    await renderer.next()
  }
  return engine
}

export function createEpubEngine(): EpubEngine {
  return { open: openEpub }
}
