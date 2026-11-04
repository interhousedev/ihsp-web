import { miniApp, openLink, viewport } from "@tma.js/sdk-react"
import { isMiniApp } from "./is-mini-app"

type TelegramWindow = { Telegram?: { WebApp?: { close?: () => void } } }

/** Opens the mini app to full height (no-op outside Telegram). */
export function expand(): void {
  if (!isMiniApp()) return
  if (viewport.expand.isAvailable()) viewport.expand()
}

/**
 * Opens an address outside the mini app through the Telegram SDK, which keeps the mini app open. Returns false outside
 * Telegram or when the SDK cannot open links, so the caller can fall back to a plain new tab.
 */
export function openExternalLink(url: string): boolean {
  if (!isMiniApp()) return false
  if (!openLink.isAvailable()) return false
  openLink(url)
  return true
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
