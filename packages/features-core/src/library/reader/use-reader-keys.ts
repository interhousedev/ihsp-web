"use client"

import { useEffect, useRef } from "react"
import { isTypingTarget, keyAction, type ReaderKeyAction } from "./lib/reader-keys"

const INTERACTIVE = "button, a[href], summary, [role='button'], [role='tab'], [role='switch'], [role='checkbox']"

/**
 * Reader shortcuts on the whole document. A key typed into a field, a dialog or a menu is left alone, and so is Space
 * on a focused button. The handler returns `true` when it used the key (then the browser's own action is cancelled).
 */
export function useReaderKeys(enabled: boolean, handle: (action: ReaderKeyAction) => boolean | void): void {
  const handler = useRef(handle)
  useEffect(() => {
    handler.current = handle
  })

  useEffect(() => {
    if (!enabled) return
    function onKeyDown(event: KeyboardEvent): void {
      const action = keyAction(event)
      if (!action) return
      if (isTypingTarget(event.target)) return
      if (
        action !== "escape" &&
        event.key === " " &&
        event.target instanceof Element &&
        event.target.closest(INTERACTIVE)
      ) {
        return
      }
      if (handler.current(action) === true) event.preventDefault()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [enabled])
}
