"use client"

import type { AnnotationColor, AnnotationKind } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useLayoutEffect, useState } from "react"
import { COLOR_BACKGROUND, COLOR_ICONS, COLOR_TEXT } from "./lib/colors"
import { findQuoteRange, rangeBoxes, type Box } from "./lib/quote-range"

type Drawn = { id: string; color: AnnotationColor; kind: AnnotationKind; boxes: Box[] }

export type HighlightLayerProps = {
  /** The element whose text the quotes are looked up in (the PDF text layer, the rendered Markdown). */
  textRoot: HTMLElement | null
  /** The positioned element the rectangles are drawn relative to (the page, the article). */
  anchor: HTMLElement | null
  /** Highlights and notes with a quote; other kinds are ignored. */
  annotations: readonly { id: string; kind: AnnotationKind; color: AnnotationColor; quote: string | null }[]
  /** A found text to mark with an outline (the current search result). */
  searchText?: string | null
  onNoteClick(id: string): void
  /** Changes whenever the text was drawn again (a new zoom, a finished page), so the rectangles are measured again. */
  version: number
  /** Blend the colour into dark text on a light page (PDF); plain translucent boxes on the app background. */
  multiply?: boolean
}

/**
 * Draws highlights over text that has no stored position: the annotation holds the quote and the page, and the quote is
 * looked up in the text that is on screen. Rectangles do not take pointer events, so the text under them stays
 * selectable; a note has a small marker that opens it.
 */
export function HighlightLayer({
  textRoot,
  anchor,
  annotations,
  searchText,
  onNoteClick,
  version,
  multiply = false,
}: HighlightLayerProps) {
  const t = useT("library.annotation")
  const [drawn, setDrawn] = useState<Drawn[]>([])
  const [found, setFound] = useState<Box[]>([])

  useLayoutEffect(() => {
    if (!textRoot || !anchor) {
      setDrawn([])
      setFound([])
      return
    }
    function measure() {
      if (!textRoot || !anchor) return
      const origin = anchor.getBoundingClientRect()
      const next: Drawn[] = []
      for (const annotation of annotations) {
        if (annotation.kind === "bookmark" || !annotation.quote) continue
        const range = findQuoteRange(textRoot, annotation.quote)
        if (!range) continue
        const boxes = rangeBoxes(range, origin)
        if (boxes.length > 0) next.push({ id: annotation.id, color: annotation.color, kind: annotation.kind, boxes })
      }
      setDrawn(next)
      const hit = searchText ? findQuoteRange(textRoot, searchText) : null
      setFound(hit ? rangeBoxes(hit, origin) : [])
    }
    measure()
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
    observer?.observe(anchor)
    return () => observer?.disconnect()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `version` is only a trigger: it changes when the text was drawn again
  }, [textRoot, anchor, annotations, searchText, version])

  if (drawn.length === 0 && found.length === 0) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-[2]">
      {drawn.map((entry) =>
        entry.boxes.map((box, index) => (
          <span
            key={`${entry.id}-${index}`}
            data-annotation={entry.id}
            data-color={entry.color}
            className={cn(
              "absolute rounded-[2px]",
              COLOR_BACKGROUND[entry.color],
              multiply && "mix-blend-multiply dark:mix-blend-normal",
            )}
            style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          />
        )),
      )}
      {found.map((box, index) => (
        <span
          key={`found-${index}`}
          data-search-hit
          className="ring-primary absolute rounded-[2px] ring-2"
          style={{ left: box.left - 1, top: box.top - 1, width: box.width + 2, height: box.height + 2 }}
        />
      ))}
      {drawn
        .filter((entry) => entry.kind === "note")
        .map((entry) => {
          const last = entry.boxes[entry.boxes.length - 1]!
          const Icon = COLOR_ICONS[entry.color]
          return (
            <button
              key={`marker-${entry.id}`}
              type="button"
              aria-label={t("openNote")}
              onClick={() => onNoteClick(entry.id)}
              className="bg-background/90 pointer-events-auto absolute flex size-6 items-center justify-center rounded-full border shadow-sm after:absolute after:-inset-3 after:content-['']"
              style={{ left: last.left + last.width + 2, top: last.top - 4 }}
            >
              <Icon className={cn("size-3", COLOR_TEXT[entry.color])} aria-hidden />
            </button>
          )
        })}
    </div>
  )
}
