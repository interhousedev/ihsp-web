import { backButton, init, miniApp, themeParams, viewport } from "@tma.js/sdk-react"
import { isMiniApp } from "./is-mini-app"
import { expand } from "./mini-app-actions"

let started: Promise<void> | null = null

/**
 * Initialises the SDK once: mounts the components the app uses and tells
 * Telegram the page is ready. Does nothing outside Telegram. CSS variables are written by `TelegramBridge`.
 */
export function initTelegram(): Promise<void> {
  if (!isMiniApp()) return Promise.resolve()
  started ??= start()
  return started
}

async function start(): Promise<void> {
  init()
  backButton.mount.ifAvailable()
  themeParams.mount.ifAvailable()
  miniApp.mount.ifAvailable()
  if (viewport.mount.isAvailable()) await viewport.mount()
  miniApp.ready.ifAvailable()
  expand()
}
