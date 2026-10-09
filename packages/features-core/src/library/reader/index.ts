// Reader, annotations and My library (LIB-W2): docs/reference/study-library.md §§ 3.8, 3.9, 9.1 to 9.4.
// pdf.js and foliate-js are imported dynamically by the readers (see `lib/load-engines.ts`), so importing this barrel
// does not load them.
export { AnnotationList, type AnnotationListProps } from "./annotation-list"
export { ColorPicker } from "./color-picker"
export { EpubReader, type EpubReaderProps } from "./epub-reader"
export { HighlightLayer } from "./highlight-layer"
export { AnnotationQueue, getAnnotationQueue, type QueuedChange } from "./lib/annotation-queue"
export type { ReaderEngines } from "./lib/load-engines"
export {
  decodeCfiLocation,
  encodeCfiLocation,
  isCfiLocator,
  isPageLocator,
  locatorToHrefParams,
  parseLocator,
  type Locator,
} from "./lib/locator"
export { findInText, normalizeWithMap, searchNormalize, uzTranslit } from "./lib/translit"
export { MyLibraryPage } from "./my/my-library-page"
export { PdfReader, type PdfReaderProps } from "./pdf-reader"
export { ReaderFooter } from "./reader-footer"
export { ReaderFrame, type ReaderFrameProps } from "./reader-frame"
export { ReaderMenu } from "./reader-menu"
export { ReaderPage } from "./reader-page"
export { ReaderToolbar } from "./reader-toolbar"
export type { ReaderHandle, ReaderPosition, ReaderSelection, ReaderViewProps } from "./reader-types"
export { SelectionToolbar } from "./selection-toolbar"
export { TextReader } from "./text-reader"
export { TocPanel } from "./toc-panel"
export { useReaderAnnotations, type ViewAnnotation } from "./use-reader-annotations"
