import { readSession, removeSession, writeSession } from "./storage"
import { redirectTo } from "./redirect"

/** One-time ticket of a registration or password reset, redeemed on IHT ID's own next login challenge. */
export const LOGIN_TICKET_KEY = "ihsp:id:login-ticket"

/**
 * Signs this browser in to IHT ID after a registration or reset that had no login challenge: the ticket waits in
 * sessionStorage, the account page starts IHT ID's own login, and the login page redeems the ticket there.
 */
export function signInWithTicket(ticket: string): void {
  writeSession(LOGIN_TICKET_KEY, ticket)
  redirectTo("/")
}

export function readLoginTicket(): string | null {
  return readSession(LOGIN_TICKET_KEY)
}

/** A used or failed ticket must never be retried. */
export function forgetLoginTicket(): void {
  removeSession(LOGIN_TICKET_KEY)
}
