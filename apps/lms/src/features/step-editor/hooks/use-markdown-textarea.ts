"use client"

import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { replacementBetween, type TextState } from "../utils/markdown/text-state"

/** Lets the browser edit the focused textarea, so the change joins its native undo history. */
function insertNatively(text: string): boolean {
  try {
    return text === "" ? document.execCommand("delete") : document.execCommand("insertText", false, text)
  } catch {
    return false
  }
}

/**
 * A Markdown textarea driven by text transforms: tracks the selection, and applies a transform result as one native
 * edit (`execCommand`), so Ctrl+Z / Ctrl+Shift+Z undo and redo it like typing. Where the browser can't edit natively,
 * the value goes through `onChange` and the selection is restored after React renders it.
 */
export function useMarkdownTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  onChange: (value: string) => void,
) {
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const pending = useRef<{ start: number; end: number } | null>(null)

  const sync = useCallback(() => {
    const textarea = ref.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    setSelection((current) => (current.start === start && current.end === end ? current : { start, end }))
  }, [ref])

  useEffect(() => {
    const onSelectionChange = () => {
      if (document.activeElement === ref.current) sync()
    }
    document.addEventListener("selectionchange", onSelectionChange)
    return () => document.removeEventListener("selectionchange", onSelectionChange)
  }, [ref, sync])

  useLayoutEffect(() => {
    const textarea = ref.current
    const wanted = pending.current
    if (!textarea || !wanted || textarea.value !== value) return
    pending.current = null
    textarea.setSelectionRange(wanted.start, wanted.end)
    sync()
  }, [ref, value, sync])

  /** The text and selection as they are in the textarea right now. */
  const read = useCallback((): TextState => {
    const textarea = ref.current
    if (!textarea) return { text: value, start: value.length, end: value.length }
    return {
      text: textarea.value,
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    }
  }, [ref, value])

  /** Writes a transform result into the textarea and selects what it says. */
  const apply = useCallback(
    (next: TextState) => {
      const textarea = ref.current
      if (!textarea) return
      textarea.focus()
      const replacement = replacementBetween(textarea.value, next.text)
      if (replacement) {
        textarea.setSelectionRange(replacement.from, replacement.to)
        if (!insertNatively(replacement.insert) || textarea.value !== next.text) {
          pending.current = { start: next.start, end: next.end }
          onChange(next.text)
          return
        }
      }
      textarea.setSelectionRange(next.start, next.end)
      sync()
    },
    [ref, onChange, sync],
  )

  return { selection, sync, read, apply }
}
