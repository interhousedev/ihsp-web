"use client"

import { useT } from "@ihsp/i18n"
import { Markdown, StateView } from "@ihsp/ui"
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react"
import { fetchFile } from "./lib/file-link"
import { isPageLocator, clampFraction } from "./lib/locator"
import { collectText } from "./lib/quote-range"
import { findInText } from "./lib/translit"
import { HighlightLayer } from "./highlight-layer"
import type { ReaderHandle, ReaderTocEntry, ReaderViewProps, SearchHit } from "./reader-types"
import { useTextSelection } from "./use-text-selection"

const HEADINGS = "h1, h2, h3, h4, h5, h6"
const CONTEXT = 40

/**
 * The view of Markdown and plain text files: the text is fetched from the file link and drawn by the safe `Markdown`
 * renderer of the UI kit (raw HTML is shown as text, only our own images load). The position is the scroll fraction;
 * highlights are found again by their quote.
 */
export function TextReader({
  item,
  file,
  links,
  startFraction,
  annotations,
  settings,
  language,
  onPosition,
  onSelection,
  onAnnotationClick,
  onReady,
  onError,
  ref,
}: ReaderViewProps) {
  const t = useT("library.reader")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [article, setArticle] = useState<HTMLDivElement | null>(null)
  const articleRef = useRef<HTMLDivElement | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  const [hit, setHit] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setText(null)
    setError(null)
    fetchFile(links, { signal: controller.signal })
      .then((response) => response.text())
      .then((body) => {
        setText(body)
        onReady({ pages: null, title: null })
      })
      .catch((problem: unknown) => {
        if (controller.signal.aborted) return
        setError(problem)
        onError(problem)
      })
    return () => controller.abort()
  }, [links, attempt, onReady, onError])

  // Resume at the saved fraction once, when the text is on screen.
  const resumed = useRef(false)
  useLayoutEffect(() => {
    const element = scrollRef.current
    if (text === null || resumed.current || !element) return
    resumed.current = true
    if (startFraction) element.scrollTop = clampFraction(startFraction) * (element.scrollHeight - element.clientHeight)
  }, [text, startFraction])

  const frame = useRef(0)
  const report = useCallback(() => {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const element = scrollRef.current
      if (!element) return
      const room = element.scrollHeight - element.clientHeight
      const fraction = room > 0 ? element.scrollTop / room : 1
      onPosition({ locator: { page: 1 }, fraction: clampFraction(fraction), label: null, page: null, pages: null })
    })
  }, [onPosition])
  useEffect(() => {
    if (text !== null) report()
    return () => cancelAnimationFrame(frame.current)
  }, [text, report])

  const [selection, clearSelection] = useTextSelection(articleRef, true)
  useEffect(() => {
    onSelection(selection ? { text: selection.text, rect: selection.rect, locator: { page: 1 }, page: null } : null)
    // Only a change of the selection itself is reported.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection])
  useEffect(() => clearSelection, [clearSelection])

  const own = useMemo(
    () => annotations.filter((annotation) => isPageLocator(annotation.locator) && annotation.kind !== "bookmark"),
    [annotations],
  )

  function scrollByPage(direction: 1 | -1) {
    const element = scrollRef.current
    if (element) element.scrollTop += direction * element.clientHeight * 0.9
  }

  useImperativeHandle(
    ref,
    (): ReaderHandle => ({
      next: () => scrollByPage(1),
      prev: () => scrollByPage(-1),
      first: () => scrollRef.current?.scrollTo({ top: 0 }),
      last: () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
      goToLocator: () => scrollRef.current?.scrollTo({ top: 0 }),
      goToToc: (entry: ReaderTocEntry) => {
        const heading = Array.from(articleRef.current?.querySelectorAll(HEADINGS) ?? []).find(
          (element) => element.textContent?.trim() === entry.title.trim(),
        )
        heading?.scrollIntoView({ block: "start" })
      },
      search: (query) =>
        (async function* (): AsyncGenerator<SearchHit> {
          const root = articleRef.current
          if (!root) return
          const { full } = collectText(root)
          let count = 0
          for (const found of findInText(full, query, language)) {
            count += 1
            yield {
              id: `t${count}`,
              page: null,
              cfi: null,
              label: null,
              excerpt: {
                pre: full.slice(Math.max(0, found.start - CONTEXT), found.start).replaceAll(/\s+/g, " "),
                match: full.slice(found.start, found.end),
                post: full.slice(found.end, found.end + CONTEXT).replaceAll(/\s+/g, " "),
              },
            }
          }
        })(),
      showHit: (found) => {
        setHit(found.excerpt.match)
        setVersion((count) => count + 1)
        queueMicrotask(() => document.querySelector("[data-search-hit]")?.scrollIntoView({ block: "center" }))
      },
      clearSearch: () => setHit(null),
      loadToc: async () =>
        Array.from(articleRef.current?.querySelectorAll(HEADINGS) ?? []).map((element) => ({
          title: element.textContent?.trim() ?? "",
          level: Number(element.tagName.slice(1)) - 1,
          page: null,
          href: null,
        })),
    }),
    [language],
  )

  if (error) {
    return <StateView state="error" error={error} onRetry={() => setAttempt((count) => count + 1)} className="m-4" />
  }
  if (text === null) {
    return (
      <div className="p-4">
        <StateView state="loading" rows={4} />
      </div>
    )
  }

  const isMarkdown = file.format === "md"
  return (
    <div
      ref={scrollRef}
      onScroll={report}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region must take keyboard focus
      tabIndex={0}
      role="region"
      aria-label={t("document")}
      className="focus-visible:ring-ring h-full overflow-auto focus-visible:ring-2 focus-visible:ring-inset"
    >
      <div
        ref={(element) => {
          articleRef.current = element
          setArticle(element)
        }}
        data-reader-text
        lang={item.language.startsWith("uz") ? "uz" : item.language}
        className="relative mx-auto max-w-3xl px-4 py-6 md:px-8"
        style={{ fontSize: `${settings.fontSize}%`, lineHeight: settings.lineHeight }}
      >
        {isMarkdown ? (
          <Markdown className="text-[1em] leading-[inherit]">{text}</Markdown>
        ) : (
          <pre className="font-sans text-[1em] leading-[inherit] break-words whitespace-pre-wrap">{text}</pre>
        )}
        <HighlightLayer
          textRoot={article}
          anchor={article}
          annotations={own}
          searchText={hit}
          onNoteClick={onAnnotationClick}
          version={version}
        />
      </div>
    </div>
  )
}
