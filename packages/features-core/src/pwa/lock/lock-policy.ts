/** When the app asks for the PIN again after it was in the background (a setting of the user, stored with the PIN). */
export const RELOCK_OPTIONS = ["immediately", "1m", "5m", "15m", "1h", "never"] as const

export type RelockOption = (typeof RELOCK_OPTIONS)[number]

/** A new PIN asks again after 5 minutes until the user chooses otherwise. */
export const DEFAULT_RELOCK: RelockOption = "5m"

/** How long the app may stay in the background without a PIN; `null` means always (only a new start asks). */
export const RELOCK_DELAY_MS: Record<RelockOption, number | null> = {
  immediately: 0,
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  never: null,
}

export function isRelockOption(value: unknown): value is RelockOption {
  return typeof value === "string" && (RELOCK_OPTIONS as readonly string[]).includes(value)
}

/** When the app last left the foreground or was unlocked; in `sessionStorage`, so a reload counts but a new launch does not. */
export const ACTIVE_MARKER_KEY = "ihsp.pwa.last-active"

/**
 * A new start (no activity marker in this session) is always locked when there is a PIN. A reload is a start only when
 * the user's delay has passed since the app was last active: with "never" a reload stays unlocked, with "immediately" it is
 * locked again.
 */
export function isLockedAtLaunch(hasPin: boolean, marker: number | null, now: number, relock: RelockOption): boolean {
  if (!hasPin) return false
  if (marker === null || marker > now) return true
  const delay = RELOCK_DELAY_MS[relock]
  return delay !== null && now - marker >= delay
}

/** Coming back to the foreground locks the app when it was away for the chosen delay or longer; never with "never". */
export function shouldLockOnReturn(
  hasPin: boolean,
  hiddenAt: number | null,
  now: number,
  relock: RelockOption,
): boolean {
  if (!hasPin || hiddenAt === null) return false
  const delay = RELOCK_DELAY_MS[relock]
  return delay !== null && now - hiddenAt >= delay
}

export function readActiveMarker(): number | null {
  try {
    const value = Number(window.sessionStorage.getItem(ACTIVE_MARKER_KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function writeActiveMarker(now: number = Date.now()): void {
  try {
    window.sessionStorage.setItem(ACTIVE_MARKER_KEY, String(now))
  } catch {
    // Without it the app asks for the PIN after every reload, which is the safe side.
  }
}
