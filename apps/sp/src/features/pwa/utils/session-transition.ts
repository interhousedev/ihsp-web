import type { AuthStatus } from "@ihsp/auth"

/** What the worker and the stored data care about in the auth state. */
export type SessionView = {
  status: AuthStatus
  userId: string | null
  /** The session was restored without the network (placeholder token). */
  offline: boolean
}

export type SessionAction = "set-user" | "clear" | null

/**
 * `set-user` when a real session starts or another user signs in (the worker keeps API answers per user), `clear` when
 * the session ends (logout, a rejected refresh, no session at start): then the stored answers, the remembered user and
 * the worker's cached answers must go. Everything else changes nothing.
 */
export function sessionTransition(previous: SessionView, next: SessionView): SessionAction {
  if (next.status === "authenticated" && next.userId && !next.offline) {
    return previous.status !== "authenticated" || previous.userId !== next.userId ? "set-user" : null
  }
  if (next.status === "anonymous" && previous.status !== "anonymous") return "clear"
  return null
}
