"use client"

import { useEffect } from "react"
import { isMiniApp } from "./launch-params"

/**
 * Shows Telegram's back button while the component is mounted and calls `onBack` when it is pressed.
 * Outside Telegram it does nothing (the page shows its own back link). The SDK is imported on demand, so pages that
 * only might run inside Telegram do not ship it.
 */
export function useBackButton(onBack: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled || !isMiniApp()) return
    let cancelled = false
    let cleanup: (() => void) | undefined
    import("@tma.js/sdk-react")
      .then(({ backButton }) => {
        if (cancelled) return
        if (!backButton.show.isAvailable() || !backButton.onClick.isAvailable()) return
        backButton.show()
        const off = backButton.onClick(onBack)
        cleanup = () => {
          off()
          if (backButton.hide.isAvailable()) backButton.hide()
        }
      })
      .catch((error: unknown) => console.error("[telegram] back button unavailable", error))
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [onBack, enabled])
}
