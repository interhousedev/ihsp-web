"use client"

import { backButton } from "@tma.js/sdk-react"
import { useEffect } from "react"
import { isMiniApp } from "./is-mini-app"

/**
 * Shows Telegram's back button while the component is mounted and calls `onBack` when it is pressed.
 * Outside Telegram it does nothing (the page shows its own back link).
 */
export function useBackButton(onBack: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled || !isMiniApp()) return
    if (!backButton.show.isAvailable() || !backButton.onClick.isAvailable()) return
    backButton.show()
    const off = backButton.onClick(onBack)
    return () => {
      off()
      if (backButton.hide.isAvailable()) backButton.hide()
    }
  }, [onBack, enabled])
}
