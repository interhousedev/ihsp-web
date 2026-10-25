import type { UserMe } from "@ihsp/api"

/** The placeholder access token of a session restored without the network; the first request after it refreshes. */
export const OFFLINE_TOKEN = "offline"

export const OFFLINE_SESSION_KEY = "ihsp.pwa.last-user"

/** The last signed-in user is remembered this long (as long as the stored query cache of the installed app). */
export const OFFLINE_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

type Stored = { user: UserMe; savedAt: number }

export function serializeOfflineSession(user: UserMe, now: number): string {
  const stored: Stored = { user, savedAt: now }
  return JSON.stringify(stored)
}

function isUser(value: unknown): value is UserMe {
  if (typeof value !== "object" || value === null) return false
  const { id, roles, preferences } = value as Partial<UserMe>
  return typeof id === "string" && Array.isArray(roles) && typeof preferences === "object" && preferences !== null
}

/** The remembered user, or `null` when nothing valid and recent is stored. */
export function parseOfflineSession(raw: string | null, now: number): UserMe | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    const { user, savedAt } = parsed as Partial<Stored>
    if (typeof savedAt !== "number" || savedAt > now || now - savedAt > OFFLINE_SESSION_MAX_AGE_MS) return null
    return isUser(user) ? user : null
  } catch {
    return null
  }
}

export function loadOfflineSession(now: number = Date.now()): UserMe | null {
  try {
    return parseOfflineSession(window.localStorage.getItem(OFFLINE_SESSION_KEY), now)
  } catch {
    return null
  }
}

export function saveOfflineSession(user: UserMe, now: number = Date.now()): void {
  try {
    window.localStorage.setItem(OFFLINE_SESSION_KEY, serializeOfflineSession(user, now))
  } catch {
    // Without storage the app simply cannot start offline.
  }
}

export function clearOfflineSession(): void {
  try {
    window.localStorage.removeItem(OFFLINE_SESSION_KEY)
  } catch {
    // Nothing is stored then.
  }
}
