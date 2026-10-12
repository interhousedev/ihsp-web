"use client"

import { useEffect, useRef } from "react"

/**
 * Moves the focus to the heading of a viewer when it opens and gives it back to whatever had it (the Studio row, a
 * citation chip) when the viewer closes.
 */
export function useFocusHeading() {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const previous = document.activeElement
    ref.current?.focus({ preventScroll: true })
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])
  return ref
}
