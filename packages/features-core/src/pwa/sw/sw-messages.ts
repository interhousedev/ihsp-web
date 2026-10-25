/**
 * The messages between the page and the service worker. Shared by both sides (the worker is a separate bundle), so keep
 * this file free of imports. The cache names are in `cache-names.ts`.
 */

/** Page → worker. */
export const SW_MESSAGE = {
  /** `{ type, userId }`: this user is signed in; API answers are cached per user. */
  setUser: "ihsp:set-user",
  /** `{ type }`: signed out or session ended; drop every cached API answer. */
  clearUser: "ihsp:clear-user",
  /** `{ type }`: a waiting worker may take over now (update). */
  skipWaiting: "ihsp:skip-waiting",
  /** `{ type }`: forget the cached pages so the next load comes from the network. */
  purgeShell: "ihsp:purge-shell",
} as const

/** Worker → page. */
export const SW_EVENT = {
  /** `{ type, url }`: the revalidated answer of a cached API request differs from what the page was given. */
  apiUpdated: "ihsp:api-updated",
} as const

export type SwMessage =
  | { type: typeof SW_MESSAGE.setUser; userId: string }
  | { type: typeof SW_MESSAGE.clearUser }
  | { type: typeof SW_MESSAGE.skipWaiting }
  | { type: typeof SW_MESSAGE.purgeShell }

export type SwEvent = { type: typeof SW_EVENT.apiUpdated; url: string }

/** A message from the page, or `null` when it is not one of ours (other scripts may post to the worker too). */
export function parseSwMessage(data: unknown): SwMessage | null {
  if (typeof data !== "object" || data === null) return null
  const { type, userId } = data as { type?: unknown; userId?: unknown }
  switch (type) {
    case SW_MESSAGE.setUser:
      return typeof userId === "string" && userId !== "" ? { type, userId } : null
    case SW_MESSAGE.clearUser:
    case SW_MESSAGE.skipWaiting:
    case SW_MESSAGE.purgeShell:
      return { type }
    default:
      return null
  }
}

/** A message from the worker, or `null`. */
export function parseSwEvent(data: unknown): SwEvent | null {
  if (typeof data !== "object" || data === null) return null
  const { type, url } = data as { type?: unknown; url?: unknown }
  return type === SW_EVENT.apiUpdated && typeof url === "string" ? { type, url } : null
}
