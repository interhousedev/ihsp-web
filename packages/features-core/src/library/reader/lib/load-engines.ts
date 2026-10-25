import type { EpubEngine, EpubEngineLoader } from "./epub-types"
import type { PdfEngine, PdfEngineLoader } from "./pdf-types"

// The heavy libraries are loaded on demand, only by the reader of that format, so no other app (sp, lms, ...) loads
// pdf.js or foliate-js through the `@ihsp/features-core` barrel. The path of each import is a literal, so the bundler
// makes one chunk per engine.

export const loadPdfEngine: PdfEngineLoader = async (): Promise<PdfEngine> => {
  const { createPdfEngine } = await import("./pdf-engine")
  return createPdfEngine()
}

export const loadEpubEngine: EpubEngineLoader = async (): Promise<EpubEngine> => {
  const { createEpubEngine } = await import("./epub-engine")
  return createEpubEngine()
}

/** The engines a reader uses; tests replace them with fakes. */
export type ReaderEngines = {
  pdf?: PdfEngineLoader
  epub?: EpubEngineLoader
}
