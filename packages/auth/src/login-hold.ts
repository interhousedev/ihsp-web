/**
 * While a logout is under way the app must not start a login: clearing the session makes `RequireAuth` call
 * `login()`, and that navigation (`/oauth2/auth`) would win against the one to Hydra's end-session URL, so the Hydra
 * session survived and the next visit signed the user in again silently.
 */
let heldUntil = 0

/** Blocks `login()` for `ms` milliseconds (the page is leaving to the logout URL). */
export function holdLogin(ms: number): void {
  heldUntil = Date.now() + ms
}

export function loginHeld(): boolean {
  return Date.now() < heldUntil
}

export function releaseLoginHold(): void {
  heldUntil = 0
}
