"use client"

import { useEffect } from "react"
import { createBackStack } from "./back-stack"
import { isMiniApp } from "./launch-params"

type Sdk = typeof import("@tma.js/sdk-react")

const stack = createBackStack()
let sdk: Sdk | undefined
let unsubscribe: (() => void) | undefined

/** Telegram has one back button: one subscription, shown while anybody wants it. */
function sync(): void {
  if (!sdk) return
  const { backButton } = sdk
  if (!stack.current()) {
    unsubscribe?.()
    unsubscribe = undefined
    if (backButton.hide.isAvailable()) backButton.hide()
    return
  }
  if (unsubscribe || !backButton.show.isAvailable() || !backButton.onClick.isAvailable()) return
  backButton.show()
  unsubscribe = backButton.onClick(() => stack.current()?.())
}

/**
 * Shows Telegram's back button while the component is mounted and calls `onBack` when it is pressed.
 * Outside Telegram it does nothing (the page shows its own back link). The SDK is imported on demand, so pages that
 * only might run inside Telegram do not ship it. With `fallback` (the shell) a page's own handler goes first.
 */
export function useBackButton(onBack: () => void, enabled = true, { fallback = false } = {}): void {
  useEffect(() => {
    if (!enabled || !isMiniApp()) return
    const remove = stack.add(onBack, fallback)
    import("@tma.js/sdk-react")
      .then((loaded) => {
        sdk = loaded
        sync()
      })
      .catch((error: unknown) => console.error("[telegram] back button unavailable", error))
    return () => {
      remove()
      sync()
    }
  }, [onBack, enabled, fallback])
}
