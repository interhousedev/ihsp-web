/**
 * Telegram launch detection without the SDK, so `@ihsp/auth` (on every page) does not pull `@tma.js` into the main
 * bundle. It reads the same sources as `@tma.js/bridge`: the launch parameters in the page URL (hash or query), the
 * navigation entry (after an in-app redirect), the `tapps/launchParams` session key the SDK writes once it has run
 * (a JSON string), and the native `TelegramWebviewProxy`.
 */

const STORAGE_KEY = "tapps/launchParams"

function toQuery(url: string): string {
  return url.replace(/^[^?#]*[?#]/, "").replace(/[?#]/g, "&")
}

function storedQuery(): string | undefined {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === "string" ? parsed : undefined
  } catch {
    return undefined
  }
}

/** Kept the way the SDK keeps it, so later pages (the router drops the hash) still know they run inside Telegram. */
function remember(query: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(query))
  } catch {
    // Storage can be blocked; the next page then reads the URL again.
  }
}

function navigationQuery(): string | undefined {
  try {
    const entry = performance.getEntriesByType("navigation")[0]
    return entry ? toQuery(entry.name) : undefined
  } catch {
    return undefined
  }
}

/** The `tgWebApp*` query string Telegram launched the page with, or `undefined` outside Telegram. */
export function launchParamsQuery(): string | undefined {
  if (typeof window === "undefined") return undefined
  for (const source of [() => toQuery(window.location.href), navigationQuery, storedQuery]) {
    const query = source()
    if (query && new URLSearchParams(query).has("tgWebAppPlatform")) {
      remember(query)
      return query
    }
  }
  return undefined
}

function hasWebviewProxy(): boolean {
  const proxy = (window as { TelegramWebviewProxy?: { postEvent?: unknown } }).TelegramWebviewProxy
  return typeof proxy?.postEvent === "function"
}

/** True when the page runs inside Telegram (launch parameters are present). False while prerendering. */
export function isMiniApp(): boolean {
  if (typeof window === "undefined") return false
  try {
    return hasWebviewProxy() || launchParamsQuery() !== undefined
  } catch {
    return false
  }
}

/** The raw, signed `initData` string for the backend (`POST /v1/oauth/telegram`); `undefined` outside Telegram. */
export function getInitDataRaw(): string | undefined {
  const query = launchParamsQuery()
  if (!query) return undefined
  return new URLSearchParams(query).get("tgWebAppData") || undefined
}
