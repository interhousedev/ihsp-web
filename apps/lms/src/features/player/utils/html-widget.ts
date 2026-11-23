import { getConfig } from "@ihsp/config"

/**
 * Scripts only: no same-origin, popups, top navigation, forms or modals (a popup could carry data out or show a fake
 * login). The served CSP repeats this sandbox.
 */
export const HTML_WIDGET_SANDBOX = "allow-scripts"
export const WIDGET_RESULT_MESSAGE = "ihsp-widget-result"
export const WIDGET_SIZE_MESSAGE = "ihsp-widget-size"
export const WIDGET_MIN_HEIGHT = 200
export const WIDGET_MAX_HEIGHT = 2000

export type WidgetMessage = { kind: "result"; scorePct: number; passed: boolean } | { kind: "size"; height: number }

/** The widget URL; in development the API runs on its own origin, in production nginx proxies the path. */
export function htmlWidgetUrl(path: string, dev = process.env.NODE_ENV === "development"): string {
  return dev ? `${getConfig().API_URL}${path}` : path
}

export function clampWidgetHeight(height: number, max = WIDGET_MAX_HEIGHT): number {
  return Math.min(Math.max(WIDGET_MIN_HEIGHT, Math.ceil(height)), Math.max(WIDGET_MIN_HEIGHT, max))
}

/**
 * Accept only messages of our own widget frame: the sandboxed document has the opaque origin "null" and the event
 * source must be that frame's window (another frame, tab or the page itself cannot forge a score).
 */
export function parseWidgetMessage(
  event: Pick<MessageEvent, "origin" | "source" | "data">,
  frame: Window | null | undefined,
): WidgetMessage | null {
  if (!frame || event.source !== frame || event.origin !== "null") return null
  const data: unknown = event.data
  if (!data || typeof data !== "object") return null
  const message = data as Record<string, unknown>
  if (message.type === WIDGET_SIZE_MESSAGE) {
    const height = message.height
    if (typeof height !== "number" || !Number.isFinite(height) || height <= 0) return null
    return { kind: "size", height: clampWidgetHeight(height) }
  }
  if (message.type === WIDGET_RESULT_MESSAGE) {
    const score = message.score_pct
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100) return null
    if (typeof message.passed !== "boolean") return null
    return { kind: "result", scorePct: Math.round(score * 100) / 100, passed: message.passed }
  }
  return null
}
