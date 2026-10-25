"use client"

import { useEffect, useRef } from "react"

/**
 * Calls `onTick` every `intervalMs` while `enabled`, and once when the browser comes back online. The caller decides
 * whether anything needs saving; the latest `onTick` is always used, so the timer never restarts on re-render.
 */
export function useAutosave({
  intervalMs,
  enabled,
  onTick,
}: {
  intervalMs: number
  enabled: boolean
  onTick: () => void
}) {
  const tick = useRef(onTick)
  useEffect(() => {
    tick.current = onTick
  })

  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => tick.current(), intervalMs)
    const online = () => tick.current()
    window.addEventListener("online", online)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("online", online)
    }
  }, [enabled, intervalMs])
}

/** Asks the browser to confirm closing the tab while there are unsaved edits. */
export function useWarnBeforeUnload(active: boolean) {
  useEffect(() => {
    if (!active) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [active])
}
