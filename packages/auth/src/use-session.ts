"use client"

import { useEffect, useMemo } from "react"
import { bootstrapSession, login } from "./session"
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
 */
export function useSilentSignIn(): void {
  const status = useAuthStore((state) => state.status)
  useEffect(() => {
    if (status !== "anonymous" || !hasSessionHint()) return
    login().catch(() => clearSessionHint())
  }, [status])
}
