"use client"

import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react"
import { isPageLocator, fractionPage, pageFraction } from "./lib/locator"
import { loadPdfEngine } from "./lib/load-engines"
import { PAGE_PADDING, computeOffsets, fitScale, pageAtOffset, visibleRange, type Size } from "./lib/pdf-layout"
import { searchPdf } from "./lib/pdf-search"
import type { PdfDocumentHandle, PdfEngineLoader } from "./lib/pdf-types"
import { PDF_TEXT_LAYER_CSS } from "./pdf-styles"
import { PdfPage } from "./pdf-page"
import type { ReaderHandle, ReaderSelection, ReaderTocEntry, ReaderViewProps, SearchHit } from "./reader-types"
import type { ViewAnnotation } from "./use-reader-annotations"
import { usePdfDocument } from "./use-pdf-document"
import { useTextSelection } from "./use-text-selection"

export type PdfReaderProps = ReaderViewProps & {
  /** Loads pdf.js; tests pass a fake engine. */
  loadEngine?: PdfEngineLoader
}

/** A4 in PDF points, used until the first page tells its real size. */
const ESTIMATE: Size = { width: 595, height: 842 }
/** happy-dom and a window that is not laid out yet report 0: use a phone-sized window. */
const FALLBACK_WINDOW: Size = { width: 360, height: 640 }
const NO_ANNOTATIONS: readonly ViewAnnotation[] = []

function useWindowSize(ref: RefObject<HTMLElement | null>): Size {
  const [size, setSize] = useState<Size>(FALLBACK_WINDOW)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    function measure() {
      const rect = element!.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setSize({ width: rect.width, height: rect.height })
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return size
}

type ViewportProps = ReaderViewProps & { doc: PdfDocumentHandle }

function PdfViewport({
  doc,
  start,
  startFraction,
  annotations,
  settings,
  language,
  onPosition,
  onSelection,
  onAnnotationClick,
  onReady,
  ref,
}: ViewportProps) {
  const t = useT("library.reader")
  const scrollRef = useRef<HTMLDivElement>(null)
  const columnRef = useRef<HTMLDivElement>(null)
  const windowSize = useWindowSize(scrollRef)
  const sizes = useRef(new Map<number, Size>())
  const [sizesVersion, setSizesVersion] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [search, setSearch] = useState<{ page: number; text: string } | null>(null)
  const pageCount = doc.pageCount

  const onSize = useCallback((number: number, size: Size) => {
    const known = sizes.current.get(number)
    if (known && known.width === size.width && known.height === size.height) return
    sizes.current.set(number, size)
    setSizesVersion((version) => version + 1)
  }, [])

  // The first page sets the estimate for pages not seen yet.
  useEffect(() => {
    let cancelled = false
    doc
      .getPage(1)
      .then((page) => {
        if (!cancelled) onSize(1, { width: page.width, height: page.height })
        page.release()
      })
      .catch(() => undefined)
    onReady({ pages: pageCount, title: null })
    return () => {
      cancelled = true
    }
  }, [doc, onSize, onReady, pageCount])

  const estimate = sizes.current.get(1) ?? ESTIMATE
  const scale = fitScale(settings.pageFit, windowSize, estimate, settings.zoom, PAGE_PADDING)
  const pageHeight = useCallback(
    (index: number) => (sizes.current.get(index + 1) ?? estimate).height * scale,
    // `sizesVersion` is how a change of the size map reaches this callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estimate, scale, sizesVersion],
  )
  const offsets = useMemo(() => computeOffsets(pageCount, pageHeight), [pageCount, pageHeight])
  const widest = useMemo(() => {
    let max = estimate.width
    for (const size of sizes.current.values()) max = Math.max(max, size.width)
    return max * scale
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimate, scale, sizesVersion])

  // - - - Where the window is - - -

  const currentIndex = pageAtOffset(offsets, scrollTop + windowSize.height * 0.3)
  const currentPage = currentIndex + 1
  const range = visibleRange(offsets, scrollTop, windowSize.height)

  /** The place the window keeps when the layout moves (pages get their real height, the zoom changes). */
  const anchor = useRef<{ index: number; ratio: number } | null>(null)
  const initialised = useRef(false)

  if (!initialised.current && anchor.current === null) {
    const startPage =
      start && isPageLocator(start) ? start.page : startFraction ? fractionPage(startFraction, pageCount) : 1
    anchor.current = { index: Math.min(Math.max(startPage, 1), pageCount) - 1, ratio: 0 }
  }

  useLayoutEffect(() => {
    const element = scrollRef.current
    const place = anchor.current
    if (!element || !place) return
    const top = offsets[place.index]! + place.ratio * pageHeight(place.index)
    if (Math.abs(element.scrollTop - top) > 1) {
      element.scrollTop = top
      setScrollTop(top)
    }
    initialised.current = true
  }, [offsets, pageHeight])

  const frame = useRef(0)
  function onScroll() {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const element = scrollRef.current
      if (!element) return
      const top = element.scrollTop
      setScrollTop(top)
      const index = pageAtOffset(offsets, top + windowSize.height * 0.3)
      anchor.current = { index, ratio: (top - offsets[index]!) / Math.max(pageHeight(index), 1) }
    })
  }
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const lastReported = useRef(0)
  useEffect(() => {
    if (lastReported.current === currentPage) return
    lastReported.current = currentPage
    onPosition({
      locator: { page: currentPage },
      fraction: pageFraction(currentPage, pageCount),
      label: null,
      page: currentPage,
      pages: pageCount,
    })
  }, [currentPage, pageCount, onPosition])

  const goToPage = useCallback(
    (page: number) => {
      const index = Math.min(Math.max(Math.round(page), 1), pageCount) - 1
      anchor.current = { index, ratio: 0 }
      const element = scrollRef.current
      if (element) {
        element.scrollTop = offsets[index]!
        setScrollTop(offsets[index]!)
      }
    },
    [offsets, pageCount],
  )

  // - - - Selection and highlights - - -

  const [selection, clearSelection] = useTextSelection(columnRef, true)
  useEffect(() => {
    if (!selection) {
      onSelection(null)
      return
    }
    const page = selection.page ?? currentPage
    const next: ReaderSelection = { text: selection.text, rect: selection.rect, locator: { page }, page }
    onSelection(next)
    // The frame decides what to do with it; this effect only reports changes of the selection itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection])
  useEffect(() => clearSelection, [clearSelection])

  const byPage = useMemo(() => {
    const map = new Map<number, ViewAnnotation[]>()
    for (const annotation of annotations) {
      if (!isPageLocator(annotation.locator)) continue
      const list = map.get(annotation.locator.page) ?? []
      list.push(annotation)
      map.set(annotation.locator.page, list)
    }
    return map
  }, [annotations])

  // - - - What the frame can ask - - -

  useImperativeHandle(
    ref,
    (): ReaderHandle => ({
      next: () => goToPage(currentPage + 1),
      prev: () => goToPage(currentPage - 1),
      first: () => goToPage(1),
      last: () => goToPage(pageCount),
      goToPage,
      goToLocator: (locator) => {
        if (isPageLocator(locator)) goToPage(locator.page)
      },
      goToToc: (entry: ReaderTocEntry) => {
        if (entry.page) goToPage(entry.page)
      },
      search: (query, signal) =>
        (async function* (): AsyncGenerator<SearchHit> {
          let count = 0
          for await (const hit of searchPdf(doc, query, language, signal)) {
            count += 1
            yield { id: `p${hit.page}-${count}`, page: hit.page, cfi: null, label: null, excerpt: hit.excerpt }
          }
        })(),
      showHit: (hit) => {
        if (!hit.page) return
        goToPage(hit.page)
        setSearch({ page: hit.page, text: hit.excerpt.match })
      },
      clearSearch: () => setSearch(null),
      loadToc: async () => {
        const outline = await doc.getOutline()
        return outline.map((entry) => ({ title: entry.title, level: entry.level, page: entry.page, href: null }))
      },
    }),
    [goToPage, currentPage, pageCount, doc, language],
  )

  // Nothing is drawn before the first page has told its size: the scale would change once it arrives.
  const pages = []
  for (let index = range.first; sizes.current.has(1) && index <= range.last; index += 1) {
    const size = sizes.current.get(index + 1) ?? estimate
    pages.push(
      <PdfPage
        key={index}
        doc={doc}
        number={index + 1}
        scale={scale}
        width={size.width * scale}
        height={size.height * scale}
        top={offsets[index]!}
        onSize={onSize}
        annotations={byPage.get(index + 1) ?? NO_ANNOTATIONS}
        searchText={search?.page === index + 1 ? search.text : null}
        onNoteClick={onAnnotationClick}
      />,
    )
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region must take keyboard focus
      tabIndex={0}
      role="region"
      aria-label={t("document")}
      className="bg-muted/40 focus-visible:ring-ring h-full overflow-auto focus-visible:ring-2 focus-visible:ring-inset"
    >
      <style>{PDF_TEXT_LAYER_CSS}</style>
      <div
        ref={columnRef}
        className="relative mx-auto"
        style={{ height: offsets[pageCount], width: Math.max(widest + PAGE_PADDING * 2, windowSize.width - 1) }}
      >
        {pages}
      </div>
    </div>
  )
}

/**
 * The PDF view: opens the document through range requests, keeps a column of page boxes and mounts only the pages
 * near the window, so a 100 MB scan of hundreds of pages stays light. It resumes at the page of `start`.
 */
export function PdfReader({ loadEngine = loadPdfEngine, ...props }: PdfReaderProps) {
  const [state, retry] = usePdfDocument(props.links, loadEngine)
  const { onError } = props
  useEffect(() => {
    if (state.status === "error") onError(state.error)
  }, [state, onError])

  if (state.status === "error") {
    return <StateView state="error" error={state.error} onRetry={retry} className="m-4" />
  }
  if (state.status === "loading") {
    return (
      <div className="p-4">
        <StateView state="loading" rows={4} />
      </div>
    )
  }
  return <PdfViewport {...props} doc={state.doc} />
}
