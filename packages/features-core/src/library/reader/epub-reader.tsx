"use client"

import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import type { EpubEngineLoader, EpubHandle, EpubMark, EpubStyle } from "./lib/epub-types"
import { fetchFile } from "./lib/file-link"
import { loadEpubEngine } from "./lib/load-engines"
import { isCfiLocator } from "./lib/locator"
import type { ReaderHandle, ReaderTocEntry, ReaderViewProps, SearchHit } from "./reader-types"
import { useThemeColors } from "./use-theme-colors"

export type EpubReaderProps = ReaderViewProps & {
  /** Loads foliate-js; tests pass a fake engine. */
  loadEngine?: EpubEngineLoader
}

/**
 * The EPUB view: foliate-js lays the book out in columns (or one scroll), the text follows the app's theme, font size
 * and line height, and the position is a CFI. The book is downloaded once (EPUBs are small) and opened from memory.
 */
export function EpubReader({ loadEngine = loadEpubEngine, ...props }: EpubReaderProps) {
  const t = useT("library.reader")
  const hostRef = useRef<HTMLDivElement>(null)
  const engine = useRef<EpubHandle | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  const colors = useThemeColors(hostRef)
  const lastFraction = useRef(0)

  // The handlers outlive one render: they read the newest props from here.
  const latest = useRef(props)
  useEffect(() => {
    latest.current = props
  })

  const style = useMemo<EpubStyle>(
    () => ({
      foreground: colors.foreground,
      background: colors.background,
      link: colors.link,
      fontSize: props.settings.fontSize,
      lineHeight: props.settings.lineHeight,
      flow: props.settings.flow,
    }),
    [colors, props.settings.fontSize, props.settings.lineHeight, props.settings.flow],
  )
  const styleNow = useRef(style)
  useEffect(() => {
    styleNow.current = style
    engine.current?.setStyle(style)
  }, [style])

  const open = useCallback(async () => {
    const host = hostRef.current
    if (!host) return null
    const loader = await loadEngine()
    const response = await fetchFile(latest.current.links)
    const file = await response.blob()
    const startLocator = latest.current.start
    const fraction = latest.current.startFraction
    return loader.open({
      file,
      host,
      style: styleNow.current,
      start: startLocator && isCfiLocator(startLocator) ? { cfi: startLocator.cfi } : fraction ? { fraction } : null,
      handlers: {
        onRelocate: (location) => {
          lastFraction.current = location.fraction
          latest.current.onPosition({
            locator: { cfi: location.cfi, progress: location.fraction },
            fraction: location.fraction,
            label: location.chapter,
            page: location.page,
            pages: location.pages,
          })
        },
        onSelection: (selection) => {
          if (!selection) {
            latest.current.onSelection(null)
            return
          }
          latest.current.onSelection({
            text: selection.text.replaceAll(/\s+/g, " ").trim(),
            rect: selection.rect,
            locator: { cfi: selection.cfi, progress: lastFraction.current },
            page: null,
          })
        },
        onMarkClick: (id) => latest.current.onAnnotationClick(id),
        onError: (problem) => latest.current.onError(problem),
      },
    })
  }, [loadEngine])

  useEffect(() => {
    let cancelled = false
    let opened: EpubHandle | null = null
    setStatus("loading")
    open()
      .then((handle) => {
        if (!handle) return
        if (cancelled) {
          handle.destroy()
          return
        }
        opened = handle
        engine.current = handle
        setStatus("ready")
        latest.current.onReady({ pages: null, title: handle.title })
      })
      .catch((problem: unknown) => {
        if (cancelled) return
        setError(problem)
        setStatus("error")
        latest.current.onError(problem)
      })
    return () => {
      cancelled = true
      engine.current = null
      opened?.destroy()
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `attempt` (Retry) and the links (another file) only trigger a new open
  }, [open, attempt, props.links])

  const marks = useMemo<EpubMark[]>(
    () =>
      props.annotations.flatMap((annotation) =>
        isCfiLocator(annotation.locator) && annotation.sync !== "failed"
          ? [{ id: annotation.id, cfi: annotation.locator.cfi, color: annotation.color, kind: annotation.kind }]
          : [],
      ),
    [props.annotations],
  )
  useEffect(() => {
    if (status === "ready") engine.current?.setMarks(marks)
  }, [marks, status])

  useImperativeHandle(
    props.ref,
    (): ReaderHandle => ({
      next: () => void engine.current?.next(),
      prev: () => void engine.current?.prev(),
      first: () => void engine.current?.goToFraction(0),
      last: () => void engine.current?.goToFraction(1),
      goToLocator: (locator) => {
        if (isCfiLocator(locator)) void engine.current?.goTo(locator.cfi)
      },
      goToToc: (entry: ReaderTocEntry) => {
        if (entry.href) void engine.current?.goTo(entry.href)
      },
      search: (query, signal) =>
        (async function* (): AsyncGenerator<SearchHit> {
          const handle = engine.current
          if (!handle) return
          let count = 0
          for await (const hit of handle.search(query, latest.current.language, signal)) {
            count += 1
            yield { id: `e${count}`, page: null, cfi: hit.cfi, label: hit.chapter, excerpt: hit.excerpt }
          }
        })(),
      showHit: (hit) => {
        if (hit.cfi) void engine.current?.showHit(hit.cfi)
      },
      clearSearch: () => engine.current?.clearSearch(),
      loadToc: async () =>
        (engine.current?.toc ?? []).map((entry) => ({
          title: entry.title,
          level: entry.level,
          page: null,
          href: entry.href,
        })),
    }),
    [],
  )

  const fixedLayout = error instanceof Error && error.message === "fixed-layout"
  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} aria-label={t("document")} role="region" className="h-full w-full" />
      {status === "loading" ? (
        <div className="bg-background absolute inset-0 p-4">
          <StateView state="loading" rows={4} />
        </div>
      ) : null}
      {status === "error" ? (
        <div className="bg-background absolute inset-0 p-4">
          {fixedLayout ? (
            <StateView state="empty" emptyText={t("fixedLayout")} />
          ) : (
            <StateView state="error" error={error} onRetry={() => setAttempt((count) => count + 1)} />
          )}
        </div>
      ) : null}
    </div>
  )
}
