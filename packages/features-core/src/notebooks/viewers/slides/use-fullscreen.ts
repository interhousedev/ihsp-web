"use client"

import { useEffect, useRef, type RefObject } from "react"

/**
 * Asks the browser to show `ref` full screen while the component is mounted and calls `onExit` when the user leaves
 * full screen (Esc is handled by the browser in that state). Where the Fullscreen API is missing (iOS Safari, Telegram
 * WebViews) nothing happens and the CSS overlay of the caller is all there is.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>, onExit: () => void): void {
  const exitRef = useRef(onExit)
  useEffect(() => {
    exitRef.current = onExit
  })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    let entered = false
    if (typeof element.requestFullscreen === "function") {
      element
        .requestFullscreen()
        .then(() => {
          entered = true
        })
        .catch(() => undefined)
    }
    function handleChange() {
      if (entered && !document.fullscreenElement) {
        entered = false
        exitRef.current()
      }
    }
    document.addEventListener("fullscreenchange", handleChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleChange)
      if (document.fullscreenElement === element && typeof document.exitFullscreen === "function") {
        void document.exitFullscreen().catch(() => undefined)
      }
    }
  }, [ref])
}
