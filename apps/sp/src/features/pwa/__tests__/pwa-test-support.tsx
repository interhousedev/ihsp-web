import { resetConfig } from "@ihsp/config"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { TEST_ENV, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import type { ReactElement } from "react"
import en from "../../../../messages/en.json"
import pwaEn from "../../../../messages/en/pwa.json"
import { renderSp } from "../../../tests/helpers"

export const PWA_MESSAGES: Messages = mergeMessages(en as Messages, pwaEn as Messages)

export const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
export const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
export const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

/** What `/env.js` says on the app host (`pwa`), or on the portal (`sp`), with an optional app address. */
export function setRuntimeConfig(mode: "sp" | "pwa", extra: Record<string, unknown> = {}): void {
  window.__ENV__ = {
    ...TEST_ENV,
    APP_MODE: mode,
    OAUTH_CLIENT_ID: mode === "pwa" ? "app" : "sp",
    ...extra,
  }
  resetConfig()
}

export type FakeBrowser = {
  userAgent: string
  platform?: string
  maxTouchPoints?: number
  /** The page runs as an installed app: `display-mode: standalone`. */
  standalone?: boolean
  /** iOS home screen apps are flagged with `navigator.standalone`. */
  iosStandalone?: boolean
}

const OVERRIDDEN = ["userAgent", "platform", "maxTouchPoints", "standalone"] as const

/** Makes the page look like a browser or an installed app. Returns the function that undoes it. */
export function fakeBrowser({
  userAgent,
  platform = "",
  maxTouchPoints = 0,
  standalone = false,
  iosStandalone,
}: FakeBrowser): () => void {
  const nav = window.navigator as unknown as Record<string, unknown>
  const values: Record<string, unknown> = { userAgent, platform, maxTouchPoints, standalone: iosStandalone }
  for (const key of OVERRIDDEN) Object.defineProperty(nav, key, { value: values[key], configurable: true })
  const previous = window.matchMedia
  window.matchMedia = ((query: string) => ({
    matches: standalone && query === "(display-mode: standalone)",
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
    onchange: null,
  })) as typeof window.matchMedia
  return () => {
    for (const key of OVERRIDDEN) delete nav[key]
    window.matchMedia = previous
  }
}

export function renderPwa(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  return renderSp(ui, { messages: PWA_MESSAGES, ...options })
}
