"use client"

import { useEffect, useMemo } from "react"
import { bootstrapSession, login, trySilentSignIn } from "./session"
import { clearSessionHint, hasSessionHint } from "./session-hint"
import { useAuthStore, type AuthStatus, type Session } from "./store"

/** The auth state of this tab. The first call on a page restores the session (cookie refresh). */
export function useSession(): { status: AuthStatus; session: Session | null } {
  const status = useAuthStore((state) => state.status)
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    void bootstrapSession()
  }, [])

  return useMemo(
    () => ({
      status,
      session: token && user ? { access_token: token.access_token, expires_at: token.expires_at, user } : null,
    }),
    [status, token, user],
  )
}

/**
 * For public pages that show a signed-out view but should still pick up an earlier sign-in: when this browser signed
 * in before (the hint) and the refresh cookie did not restore it, single sign-on signs the user in again without a
 * form. Pages behind `RequireAuth` do this on their own.
 *
 * With `{ always: true }` (the library) every anonymous browser, hint or not, tries one `prompt=none` sign-in per browser
 * session, so a user signed in anywhere on the platform is signed in here; if there is no platform session the visitor
 * stays anonymous without an error.
 */
export function useSilentSignIn(options: { always?: boolean } = {}): void {
  const status = useAuthStore((state) => state.status)
  const always = options.always === true
  useEffect(() => {
    if (status !== "anonymous") return
    if (always) {
      trySilentSignIn().catch(() => undefined)
    } else if (hasSessionHint()) {
      login().catch(() => clearSessionHint())
    }
  }, [status, always])
}
