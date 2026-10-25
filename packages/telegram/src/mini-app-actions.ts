import { miniApp, viewport } from "@tma.js/sdk-react"
import { isMiniApp } from "./is-mini-app"

type TelegramWindow = { Telegram?: { WebApp?: { close?: () => void } } }

/** Opens the mini app to full height (no-op outside Telegram). */
export function expand(): void {
  if (!isMiniApp()) return
  if (viewport.expand.isAvailable()) viewport.expand()
}

/** Closes the mini app (for example after a successful login in the `id` app's `/telegram/` page). */
export function closeMiniApp(): void {
  if (!isMiniApp()) return
  if (miniApp.close.isAvailable()) {
    miniApp.close()
    return
  }
  ;(window as unknown as TelegramWindow).Telegram?.WebApp?.close?.()
}
