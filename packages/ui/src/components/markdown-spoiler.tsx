"use client"

import { useT } from "@ihsp/i18n"
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react"

/**
 * Spoiler text (`||text||`) under a moving dotted veil, revealed by a click, a tap, Enter or Space. While hidden, the
 * text is out of the accessibility tree and its links can't be focused or clicked (`inert`); screen readers hear a
 * "hidden text" button. After the reveal, focus stays on the text.
 */
export function MarkdownSpoiler({ children }: { children?: ReactNode }) {
  const t = useT()
  const [revealed, setRevealed] = useState(false)
  const [focusText, setFocusText] = useState(false)
  const text = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (revealed && focusText) text.current?.focus()
  }, [revealed, focusText])

  function reveal(withKeyboard: boolean) {
    setFocusText(withKeyboard)
    setRevealed(true)
  }

  function onKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    reveal(true)
  }

  if (revealed) {
    return (
      <span
        ref={text}
        tabIndex={-1}
        data-spoiler="revealed"
        className="bg-muted rounded-sm box-decoration-clone px-0.5 outline-none"
      >
        {children}
      </span>
    )
  }
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={t("markdown.spoiler")}
      title={t("markdown.spoiler")}
      data-spoiler="hidden"
      onClick={() => reveal(false)}
      onKeyDown={onKeyDown}
      className="spoiler-veil focus-visible:ring-ring/50 cursor-pointer rounded-sm px-0.5 outline-none select-none focus-visible:ring-2"
    >
      <span aria-hidden inert className="opacity-0">
        {children}
      </span>
    </span>
  )
}
