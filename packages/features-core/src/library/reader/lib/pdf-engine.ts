import * as pdfjs from "pdfjs-dist"
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist"
import { fetchFile, parseContentRange, type FileLinks } from "./file-link"
import type { PdfDocumentHandle, PdfEngine, PdfOpenOptions, PdfOutlineEntry, PdfPageHandle, PdfTask } from "./pdf-types"

// The pdf.js engine. Import this file only dynamically (`load-engines.ts`): it pulls in pdf.js (about 800 KB) and
// starts a worker. The worker is self-hosted: the bundler copies `pdf.worker.min.mjs` next to the app, the deploy serves
// `.mjs` as JavaScript and the CSP allows `worker-src 'self' blob:`.
//
// CSP notes (no `unsafe-eval`, no `wasm-unsafe-eval`): pdf.js 6 does not use `new Function`; `useWasm: false` skips
// WebAssembly, so JPX, JBIG2 and ICC profiles use the JavaScript fallbacks, which are loaded from `ASSET_BASE` (copy
// `pdfjs-dist/{wasm,cmaps,standard_fonts,iccs}` there; without them only those image types and a few non-embedded
// fonts degrade).

const ASSET_BASE = "/pdfjs/"
/** The first request asks for this much: enough for the header and often the whole of a small file. */
const FIRST_CHUNK = 64 * 1024
const MAX_CANVAS_PIXELS = 16_000_000
const MAX_OUTLINE_ENTRIES = 500

let workerReady = false
function ensureWorker(): void {
  if (workerReady) return
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()
  workerReady = true
}

/** pdf.js asks for byte ranges; they are fetched from the presigned URL, which is renewed on a `403`. */
class StorageRangeTransport extends pdfjs.PDFDataRangeTransport {
  readonly #links: FileLinks
  readonly #onError: ((error: unknown) => void) | undefined
  #failed = false

  constructor(length: number, initialData: Uint8Array, links: FileLinks, onError: PdfOpenOptions["onError"]) {
    super(length, initialData)
    this.#links = links
    this.#onError = onError
  }

  override requestDataRange(begin: number, end: number): void {
    fetchFile(this.#links, { headers: { Range: `bytes=${begin}-${end - 1}` } })
      .then(async (response) => this.onDataRange(begin, new Uint8Array(await response.arrayBuffer())))
      .catch((error: unknown) => {
        if (this.#failed) return
        this.#failed = true
        this.#onError?.(error)
      })
  }
}

type LoadSource = { data: Uint8Array } | { range: StorageRangeTransport }

async function chooseSource(links: FileLinks, options: PdfOpenOptions): Promise<LoadSource> {
  const response = await fetchFile(links, { headers: { Range: `bytes=0-${FIRST_CHUNK - 1}` } })
  const bytes = new Uint8Array(await response.arrayBuffer())
  const range = response.status === 206 ? parseContentRange(response.headers.get("Content-Range")) : null
  // Without range support the storage sends the whole file (200): pdf.js reads it as it is.
  if (!range || range.total <= bytes.length) return { data: bytes }
  return { range: new StorageRangeTransport(range.total, bytes, links, options.onError) }
}

function wrapTask(run: () => { promise: Promise<unknown>; cancel: () => void }): PdfTask {
  const task = run()
  return { promise: task.promise.then(() => undefined), cancel: () => task.cancel() }
}

function wrapPage(page: PDFPageProxy): PdfPageHandle {
  const base = page.getViewport({ scale: 1 })
  return {
    number: page.pageNumber,
    width: base.width,
    height: base.height,
    renderCanvas(canvas, scale, pixelRatio) {
      return wrapTask(() => {
        // A big page at a high zoom would need a canvas the browser refuses: lower the pixel ratio instead.
        const area = base.width * scale * (base.height * scale)
        const ratio = Math.max(1, Math.min(pixelRatio, Math.sqrt(MAX_CANVAS_PIXELS / Math.max(area, 1))))
        const viewport = page.getViewport({ scale: scale * ratio })
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = `${Math.floor(base.width * scale)}px`
        canvas.style.height = `${Math.floor(base.height * scale)}px`
        return page.render({ canvas, viewport })
      })
    },
    renderTextLayer(container, scale) {
      return wrapTask(() => {
        container.replaceChildren()
        container.style.setProperty("--total-scale-factor", String(scale))
        container.style.width = `${Math.floor(base.width * scale)}px`
        container.style.height = `${Math.floor(base.height * scale)}px`
        const layer = new pdfjs.TextLayer({
          textContentSource: page.streamTextContent(),
          container,
          viewport: page.getViewport({ scale }),
        })
        return { promise: layer.render(), cancel: () => layer.cancel() }
      })
    },
    async getText() {
      const content = await page.getTextContent()
      let text = ""
      for (const item of content.items) {
        if ("str" in item) text += item.hasEOL ? `${item.str}\n` : item.str
      }
      return text
    },
    release() {
      page.cleanup()
    },
  }
}

async function pageOf(doc: PDFDocumentProxy, dest: unknown): Promise<number | null> {
  try {
    const resolved = typeof dest === "string" ? await doc.getDestination(dest) : dest
    if (!Array.isArray(resolved)) return null
    const target: unknown = resolved[0]
    if (typeof target === "number") return target + 1
    if (target && typeof target === "object")
      return (await doc.getPageIndex(target as { num: number; gen: number })) + 1
    return null
  } catch {
    return null
  }
}

type OutlineNode = { title: string; dest: unknown; items?: OutlineNode[] }

async function flattenOutline(doc: PDFDocumentProxy, nodes: OutlineNode[], level: number, out: PdfOutlineEntry[]) {
  for (const node of nodes) {
    if (out.length >= MAX_OUTLINE_ENTRIES) return
    out.push({ title: node.title, page: await pageOf(doc, node.dest), level })
    if (node.items?.length) await flattenOutline(doc, node.items, level + 1, out)
  }
}

function wrapDocument(doc: PDFDocumentProxy, destroy: () => Promise<void>): PdfDocumentHandle {
  return {
    pageCount: doc.numPages,
    async getPage(number) {
      return wrapPage(await doc.getPage(number))
    },
    async getOutline() {
      const outline = await doc.getOutline()
      const entries: PdfOutlineEntry[] = []
      if (outline) await flattenOutline(doc, outline as OutlineNode[], 0, entries)
      return entries
    },
    destroy,
  }
}

export function createPdfEngine(): PdfEngine {
  return {
    async open(links, options = {}) {
      ensureWorker()
      const source = await chooseSource(links, options)
      const task = pdfjs.getDocument({
        ...source,
        disableStream: true,
        disableAutoFetch: true,
        useWasm: false,
        cMapUrl: `${ASSET_BASE}cmaps/`,
        standardFontDataUrl: `${ASSET_BASE}standard_fonts/`,
        wasmUrl: `${ASSET_BASE}wasm/`,
        iccUrl: `${ASSET_BASE}iccs/`,
      })
      return wrapDocument(await task.promise, () => task.destroy())
    },
  }
}
