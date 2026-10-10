/**
 * Web push in the service worker as pure functions: what a push payload means, which notification it becomes, and where a
 * tap on it goes. `run-service-worker.ts` wires them to the `push` and `notificationclick` events.
 */

/** The JSON the backend pushes (`{title, body, url, tag, notification_id, type}`); only `title` may be missing. */
export type PushPayload = {
  title: string
  body: string
  url: string
  tag: string | null
  notificationId: string | null
  type: string | null
}

export const DEFAULT_TITLE = "IHT"
export const NOTIFICATION_ICON = "/icons/icon-192.png"
export const NOTIFICATION_BADGE = "/icons/badge-96.png"

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null
}

/** A payload that is not JSON (a test push from a browser tool) still shows something. */
export function parsePushPayload(raw: string | null): PushPayload {
  let data: Record<string, unknown> = {}
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed === "object" && parsed !== null) data = parsed as Record<string, unknown>
      else data = { body: raw }
    } catch {
      data = { body: raw }
    }
  }
  return {
    title: text(data.title) ?? DEFAULT_TITLE,
    body: text(data.body) ?? "",
    url: text(data.url) ?? "/",
    tag: text(data.tag),
    notificationId: text(data.notification_id),
    type: text(data.type),
  }
}

/** What `showNotification` gets: the tag replaces an older notification of the same kind instead of stacking. */
export function notificationOptions(payload: PushPayload): {
  body: string
  tag?: string
  data: { url: string; notification_id: string | null; type: string | null }
  icon: string
  badge: string
} {
  return {
    body: payload.body,
    ...(payload.tag ? { tag: payload.tag } : {}),
    data: { url: payload.url, notification_id: payload.notificationId, type: payload.type },
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
  }
}

/** Where a tap goes: inside the app (a path of the app host), or out to another site in a new window. */
export type ClickTarget = { kind: "app"; url: string } | { kind: "external"; url: string }

/**
 * The backend builds links on the portal host (`https://my.ihsu.uz/grades/`); in the installed app they open on the app host,
 * in the same window. A link to another site opens as a new window; anything that is not a web address goes home.
 */
export function clickTarget(url: unknown, ownOrigin: string, portalOrigin: string | null): ClickTarget {
  const home: ClickTarget = { kind: "app", url: `${ownOrigin}/` }
  if (typeof url !== "string" || url === "") return home
  let parsed: URL
  try {
    parsed = new URL(url, ownOrigin)
  } catch {
    return home
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return home
  if (parsed.origin === ownOrigin || parsed.origin === portalOrigin) {
    return { kind: "app", url: `${ownOrigin}${parsed.pathname}${parsed.search}${parsed.hash}` }
  }
  return { kind: "external", url: parsed.href }
}
