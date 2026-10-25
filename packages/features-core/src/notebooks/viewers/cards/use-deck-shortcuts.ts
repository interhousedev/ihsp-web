"use client"

import { useEffect } from "react"

type DeckShortcuts = {
  /** Only while the answer is showing. */
  enabled: boolean
  known: () => void
  missed: () => void
}

/** Typing, menus and dialogs keep their keys. */
function ignores(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return true
  const target = event.target
  if (!(target instanceof Element)) return false
  return (
    target.closest(
      "input, textarea, select, [contenteditable='true'], [role='dialog'], [role='alertdialog'], [role='menu']",
    ) !== null
  )
}

/** Keys of the flash cards: 1 or ← is "Missed it", 2 or → is "Got it" (after the card was flipped). */
export function useDeckShortcuts({ enabled, known, missed }: DeckShortcuts): void {
  useEffect(() => {
    if (!enabled) return
    function onKeyDown(event: KeyboardEvent) {
      if (ignores(event)) return
      if (event.key === "1" || event.key === "ArrowLeft") {
        event.preventDefault()
        missed()
      } else if (event.key === "2" || event.key === "ArrowRight") {
        event.preventDefault()
        known()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [enabled, known, missed])
}
