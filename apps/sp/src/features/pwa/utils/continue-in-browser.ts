/** "Continue in browser" is remembered for this long, then the install page is offered again. */
export const CONTINUE_IN_BROWSER_MS = 7 * 24 * 60 * 60 * 1000

export const CONTINUE_IN_BROWSER_KEY = "ihsp.pwa.continue-in-browser"

/** True while a stored choice (a Unix time in ms) is younger than the remembered period. */
export function isContinueActive(stored: string | null, now: number): boolean {
  if (!stored) return false
  const at = Number(stored)
  return Number.isFinite(at) && at <= now && now - at < CONTINUE_IN_BROWSER_MS
}

export function readContinueInBrowser(now: number = Date.now()): boolean {
  try {
    return isContinueActive(window.localStorage.getItem(CONTINUE_IN_BROWSER_KEY), now)
  } catch {
    return false
  }
}

export function rememberContinueInBrowser(now: number = Date.now()): void {
  try {
    window.localStorage.setItem(CONTINUE_IN_BROWSER_KEY, String(now))
  } catch {
    // Without storage the choice only lasts until the page is closed (the caller keeps it in state).
  }
}
