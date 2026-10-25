"use client"

import { useEffect, useRef } from "react"
import { isTypingTarget } from "./queue-utils"

export type QueueShortcuts = {
  /** `a` */
  approve: () => void
  /** `c` */
  requestChanges: () => void
  /** `r` */
  reject: () => void
  /** `h` */
  hold: () => void
  /** `j` */
  next: () => void
  /** `k` */
  previous: () => void
}

/**
 * Letter shortcuts of the queue (design § 3.6: `a` `r` `h`; plus `c` for "request changes" and `j` `k` to move). They
 * act on the selected row and are off while the librarian types in a field, while a dialog is open, or when a
 * modifier key is held (browser shortcuts stay theirs).
 */
export function useQueueShortcuts(handlers: QueueShortcuts, enabled: boolean): void {
  const latest = useRef(handlers)
  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    if (!enabled) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
      if (isTypingTarget(event.target)) return
      const current = latest.current
      const action = {
        a: current.approve,
        c: current.requestChanges,
        r: current.reject,
        h: current.hold,
        j: current.next,
        k: current.previous,
      }[event.key.toLowerCase()]
      if (!action) return
      event.preventDefault()
      action()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [enabled])
}
