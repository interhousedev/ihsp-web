"use client"

import { useEffect, useMemo } from "react"
import { bootstrapSession } from "./session"
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
