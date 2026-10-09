"use client"

import { useEffect, useState, type RefObject } from "react"

const MAX_LENGTH = 1000
/** A tap on the "Ask" button clears the selection on some phones before the click arrives; wait a little. */
const CLEAR_DELAY_MS = 300

/** The text the student has selected inside `root` (empty when nothing, or something outside, is selected). */
export function useTextSelection(root: RefObject<HTMLElement | null>): string {
  const [text, setText] = useState("")

  useEffect(() => {
    let clearTimer: ReturnType<typeof setTimeout> | null = null

    function update() {
      const element = root.current
      const selection = window.getSelection()
      const inside =
        element !== null &&
        selection !== null &&
        !selection.isCollapsed &&
        selection.rangeCount > 0 &&
        element.contains(selection.getRangeAt(0).commonAncestorContainer)
      if (inside) {
        if (clearTimer !== null) clearTimeout(clearTimer)
        clearTimer = null
        setText(selection.toString().replace(/\s+/g, " ").trim().slice(0, MAX_LENGTH))
        return
      }
      if (clearTimer === null) clearTimer = setTimeout(() => setText(""), CLEAR_DELAY_MS)
    }

    document.addEventListener("selectionchange", update)
    return () => {
      document.removeEventListener("selectionchange", update)
      if (clearTimer !== null) clearTimeout(clearTimer)
    }
  }, [root])

  return text
}
