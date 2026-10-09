"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

/** What the selection toolbar needs: the text, where it is on screen, and the page it is on (PDF). */
export type TextSelection = {
  text: string
  rect: { left: number; top: number; width: number; height: number }
  page: number | null
}

const SETTLE_MS = 120
const MAX_QUOTE = 1000

/** Collapses the line breaks and runs of spaces of a selection into single spaces, and cuts a very long one. */
export function cleanQuote(text: string): string {
  const flat = text.replaceAll(/\s+/g, " ").trim()
  return flat.length > MAX_QUOTE ? `${flat.slice(0, MAX_QUOTE - 1)}…` : flat
}

/**
 * The text the user has selected inside `rootRef` (the PDF text layer or the Markdown text). It reports once the
 * selection has settled (the handles of a touch selection fire `selectionchange` all the time). The selection stays
 * in the result until it is cleared, even when a tap on a toolbar button moves the browser's own selection.
 */
export function useTextSelection(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): [TextSelection | null, () => void] {
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    if (!enabled) {
      setSelection(null)
      return
    }
    function read() {
      const root = rootRef.current
      const current = document.getSelection()
      if (!root || !current || current.isCollapsed || current.rangeCount === 0) {
        setSelection(null)
        return
      }
      const range = current.getRangeAt(0)
      if (!root.contains(range.commonAncestorContainer)) return
      const text = cleanQuote(current.toString())
      if (text.length < 2) {
        setSelection(null)
        return
      }
      const rect = range.getBoundingClientRect()
      const start = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement
      const pageNumber = Number(start?.closest<HTMLElement>("[data-page]")?.dataset.page)
      setSelection({
        text,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        page: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : null,
      })
    }
    function onChange() {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(read, SETTLE_MS)
    }
    document.addEventListener("selectionchange", onChange)
    return () => {
      document.removeEventListener("selectionchange", onChange)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [enabled, rootRef])

  return [selection, clear]
}
