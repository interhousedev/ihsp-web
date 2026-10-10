/**
 * A non-secret flag (this browser has signed in to this app) in localStorage. The refresh cookie is HttpOnly, so
 * the page cannot see whether it exists; without the flag a first-time visitor would send a refresh request that is
 * certain to fail with 401. The flag is only a hint: the server still decides.
 */
const KEY = "ihsp.session.hint"

export function hasSessionHint(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1"
  } catch {
    // Storage blocked: behave as before and try the refresh.
    return true
  }
}

export function setSessionHint(): void {
  try {
    window.localStorage.setItem(KEY, "1")
  } catch {
    // nothing to remember
  }
}

export function clearSessionHint(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}
