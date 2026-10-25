import type { FileLinks } from "./file-link"

// What the PDF reader needs from a PDF library. `pdf-engine.ts` implements it with pdf.js (loaded dynamically, so no
// other app pays for it); the tests pass a small fake, because happy-dom has no canvas and no worker.

export type PdfTask = {
  /** Resolves when drawing is done; rejects when it failed. A cancelled task rejects too (see `isCancelled`). */
  promise: Promise<void>
  cancel(): void
}

export type PdfOutlineEntry = { title: string; page: number | null; level: number }

export interface PdfPageHandle {
  readonly number: number
  /** Size in CSS pixels at scale 1. */
  readonly width: number
  readonly height: number
  /** Draws the page into `canvas` at `scale` (CSS pixels per PDF point) and the given pixel ratio. */
  renderCanvas(canvas: HTMLCanvasElement, scale: number, pixelRatio: number): PdfTask
  /** Fills `container` with the selectable, screen-reader-visible text of the page. */
  renderTextLayer(container: HTMLElement, scale: number): PdfTask
  /** The plain text of the page (for search). */
  getText(): Promise<string>
  /** Frees what the page holds in memory; it can be drawn again. */
  release(): void
}

export interface PdfDocumentHandle {
  readonly pageCount: number
  getPage(number: number): Promise<PdfPageHandle>
  getOutline(): Promise<PdfOutlineEntry[]>
  destroy(): Promise<void>
}

export type PdfOpenOptions = {
  /** Called once when later range requests keep failing (the document stops loading). */
  onError?: (error: unknown) => void
}

export interface PdfEngine {
  open(links: FileLinks, options?: PdfOpenOptions): Promise<PdfDocumentHandle>
}

export type PdfEngineLoader = () => Promise<PdfEngine>

/** True when a rejected task was cancelled on purpose (the page scrolled away, the zoom changed). */
export function isCancelled(error: unknown): boolean {
  const name = (error as { name?: string } | null)?.name
  return name === "RenderingCancelledException" || name === "AbortException" || name === "AbortError"
}
