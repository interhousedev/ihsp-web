"use client"

import { useEffect, useState, type RefObject } from "react"

export type TextSelection = {
  text: string
  /** Where the selection is on screen (to place the floating toolbar); null when the browser cannot tell. */
  rect: { top: number; left: number; width: number } | null
}

const MAX_SELECTED_CHARS = 2000

function readSelection(container: HTMLElement | null): TextSelection | null {
  if (!container || typeof window.getSelection !== "function") return null
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) return null
  const text = selection.toString().replace(/\s+/g, " ").trim().slice(0, MAX_SELECTED_CHARS)
  if (text === "") return null
  const box = typeof range.getBoundingClientRect === "function" ? range.getBoundingClientRect() : null
  return { text, rect: box && box.width + box.height > 0 ? { top: box.top, left: box.left, width: box.width } : null }
}

/** The text the student selected inside `containerRef` (updated on `selectionchange` and while scrolling). */
export function useTextSelection(containerRef: RefObject<HTMLElement | null>) {
  const [selected, setSelected] = useState<TextSelection | null>(null)

  useEffect(() => {
    const update = () => setSelected(readSelection(containerRef.current))
    document.addEventListener("selectionchange", update)
    window.addEventListener("scroll", update, true)
    return () => {
      document.removeEventListener("selectionchange", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [containerRef])

  function clear() {
    if (typeof window.getSelection === "function") window.getSelection()?.removeAllRanges()
    setSelected(null)
  }

  return { selected, clear }
}
