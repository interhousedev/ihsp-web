import { isPwaMode } from "../../pwa/utils/app-mode"

/** Queries kept in `localStorage` for offline reading (WEB-30): today, timetable, homework and grades (with the record book). */
const PERSISTED = new Set(["today", "timetable", "homework", "grades", "record-book"])

/** How long a stored answer is shown while the network is down (24 hours). */
export const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000

/** The installable app keeps them longer (7 days): it is opened from the home screen, often offline. */
export const PWA_PERSIST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** Raise it when the shape of a persisted answer changes; the installed app then drops what it stored. */
export const PWA_PERSIST_VERSION = 1

/** The age limit of the stored answers: 24 hours in the portal, 7 days in the installable app. */
export function persistMaxAgeMs(pwa: boolean = isPwaMode()): number {
  return pwa ? PWA_PERSIST_MAX_AGE_MS : PERSIST_MAX_AGE_MS
}

/**
 * A stored cache only restores for the buster it was written with: the user (another account discards it) and, in the
 * installable app, the storage version. The portal keeps the plain user id.
 */
export function persistBuster(userId: string, pwa: boolean = isPwaMode()): string {
  return pwa ? `${userId}|pwa-v${PWA_PERSIST_VERSION}` : userId
}

export const PERSIST_STORAGE_KEY = "ihsp.sp.query-cache"

/** `["me", "today"]`, `["me", "timetable", {...}]`, `["me", "grades", "day", date]` … */
export function isPersistedQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "me" && typeof queryKey[1] === "string" && PERSISTED.has(queryKey[1])
}

/** Same prefixes as a list, for `setQueryDefaults` (stored queries must live in memory as long as in storage). */
export const PERSISTED_KEY_PREFIXES: readonly (readonly string[])[] = [...PERSISTED].map((name) => ["me", name])

/** Removes the stored answers (logout, or another account on the same browser). */
export function clearPersistedQueries(): void {
  try {
    window.localStorage.removeItem(PERSIST_STORAGE_KEY)
  } catch {
    // Storage can be blocked; there is nothing stored then.
  }
}
