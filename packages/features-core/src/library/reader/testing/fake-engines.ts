import type {
  EpubEngine,
  EpubHandle,
  EpubHandlers,
  EpubMark,
  EpubOpenOptions,
  EpubSearchHit,
  EpubStyle,
} from "../lib/epub-types"
import type { FileLinks } from "../lib/file-link"
import type { PdfDocumentHandle, PdfEngine, PdfOpenOptions, PdfPageHandle, PdfTask } from "../lib/pdf-types"

// Stand-ins for pdf.js and foliate-js in tests: happy-dom has no canvas, no worker and no column layout, so the readers
// get an engine that draws nothing but fills the text layer, which is what selection, highlights and search work on.

const done: PdfTask = { promise: Promise.resolve(), cancel: () => undefined }

export type FakePdf = {
  engine: PdfEngine
  /** Page numbers handed out by `getPage`, in order. */
  requested: number[]
  /** Page numbers that were drawn (canvas rendered). */
  drawn: Set<number>
  /** The options and links `open` received. */
  opened: { links: FileLinks; options: PdfOpenOptions | undefined }[]
  destroyed: () => number
}

/** A PDF of `pages` pages; `textOf(n)` is the text of page n (lines are separated by new lines). */
export function createFakePdf(
  pages: number,
  textOf: (page: number) => string = (page) => `Text of page ${page}.`,
  size = { width: 600, height: 800 },
): FakePdf {
  const requested: number[] = []
  const drawn = new Set<number>()
  const opened: FakePdf["opened"] = []
  let destroyed = 0
  const document: PdfDocumentHandle = {
    pageCount: pages,
    async getPage(number) {
      requested.push(number)
      const page: PdfPageHandle = {
        number,
        width: size.width,
        height: size.height,
        renderCanvas() {
          drawn.add(number)
          return done
        },
        renderTextLayer(container) {
          container.replaceChildren()
          for (const line of textOf(number).split("\n")) {
            const span = globalThis.document.createElement("span")
            span.textContent = line
            container.append(span, globalThis.document.createElement("br"))
          }
          return done
        },
        getText: async () => textOf(number),
        release: () => undefined,
      }
      return page
    },
    getOutline: async () => [
      { title: "Chapter one", page: 2, level: 0 },
      { title: "Section 1.1", page: 3, level: 1 },
    ],
    destroy: async () => {
      destroyed += 1
    },
  }
  return {
    engine: {
      open: async (links, options) => {
        opened.push({ links, options })
        return document
      },
    },
    requested,
    drawn,
    opened,
    destroyed: () => destroyed,
  }
}

export type FakeEpub = {
  engine: EpubEngine
  /** The options of the last `open` and the handle it returned. */
  last: () => { options: EpubOpenOptions; handle: FakeEpubHandle } | null
}

export class FakeEpubHandle implements EpubHandle {
  readonly toc = [
    { title: "Preface", href: "ch1.xhtml", level: 0 },
    { title: "Chapter 2", href: "ch2.xhtml", level: 0 },
  ]
  readonly title = "A fake book"
  readonly calls: string[] = []
  marks: EpubMark[] = []
  style: EpubStyle
  destroyed = false
  readonly #handlers: EpubHandlers

  constructor(options: EpubOpenOptions) {
    this.style = options.style
    this.#handlers = options.handlers
  }

  async goTo(target: string) {
    this.calls.push(`goTo ${target}`)
  }
  async goToFraction(fraction: number) {
    this.calls.push(`fraction ${fraction}`)
  }
  async next() {
    this.calls.push("next")
  }
  async prev() {
    this.calls.push("prev")
  }
  setStyle(style: EpubStyle) {
    this.style = style
  }
  setMarks(marks: readonly EpubMark[]) {
    this.marks = [...marks]
  }
  async *search(query: string, _language: string, _signal: AbortSignal): AsyncGenerator<EpubSearchHit> {
    yield { cfi: "epubcfi(/6/4!/4/2)", chapter: "Preface", excerpt: { pre: "found ", match: query, post: " here" } }
  }
  async showHit(cfi: string) {
    this.calls.push(`hit ${cfi}`)
  }
  clearSearch() {
    this.calls.push("clearSearch")
  }
  selectedText() {
    return ""
  }
  clearSelection() {
    this.#handlers.onSelection(null)
  }
  destroy() {
    this.destroyed = true
  }

  // Test controls: what foliate would report.
  relocate(cfi: string, fraction: number, chapter: string | null = null) {
    this.#handlers.onRelocate({ cfi, fraction, chapter, page: 2, pages: 10 })
  }
  select(text: string, cfi = "epubcfi(/6/4!/4/2,/1:0,/1:5)") {
    this.#handlers.onSelection({ cfi, text, rect: { left: 100, top: 200, width: 80, height: 20 } })
  }
  clickMark(id: string) {
    this.#handlers.onMarkClick(id)
  }
}

export function createFakeEpub(): FakeEpub {
  let last: { options: EpubOpenOptions; handle: FakeEpubHandle } | null = null
  return {
    engine: {
      open: async (options) => {
        const handle = new FakeEpubHandle(options)
        last = { options, handle }
        return handle
      },
    },
    last: () => last,
  }
}
