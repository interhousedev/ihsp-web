/** Do not ask the server about the version more often than this (focus, visibility and online events come in bursts). */
export const VERSION_CHECK_MIN_INTERVAL_MS = 60_000

/** While the app stays open, ask again this often. */
export const VERSION_CHECK_INTERVAL_MS = 30 * 60_000

/** After a forced reload that did not help (the new build is not deployed yet), do not reload again for this long. */
export const FORCE_RELOAD_COOLDOWN_MS = 10 * 60_000

/** True when enough time has passed since the last check (or there was none). */
export function shouldCheckVersion(lastCheckAt: number | null, now: number): boolean {
  return lastCheckAt === null || now - lastCheckAt >= VERSION_CHECK_MIN_INTERVAL_MS
}

/** The last forced reload, kept in `sessionStorage` so a reload can tell it already tried. */
export type ForcedReload = { target: string; at: number }

/**
 * A forced update reloads the page once per target version: when the reload comes back still too old (the deployment
 * is behind the settings), reloading again would loop. Inside the cooldown the app falls back to the update toast.
 */
export function mayForceReload(previous: ForcedReload | null, target: string, now: number): boolean {
  if (!previous) return true
  if (previous.target !== target) return true
  return now - previous.at >= FORCE_RELOAD_COOLDOWN_MS
}

const STORAGE_KEY = "ihsp.pwa.forced-reload"

export function readForcedReload(storage: Pick<Storage, "getItem"> = window.sessionStorage): ForcedReload | null {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    const { target, at } = parsed as Partial<ForcedReload>
    return typeof target === "string" && typeof at === "number" ? { target, at } : null
  } catch {
    return null
  }
}

export function writeForcedReload(
  value: ForcedReload,
  storage: Pick<Storage, "setItem"> = window.sessionStorage,
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage can be blocked; the cooldown is then only best effort.
  }
}
