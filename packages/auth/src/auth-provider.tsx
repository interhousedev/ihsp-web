"use client"

import { useEffect, useState, type ReactNode } from "react"
import { listenForLogout } from "./channel"
import { configureApiClient } from "./session"

/**
 * Wires the API client to the auth store (before any child renders, so the first request already has a token
 * source) and follows logouts from other tabs. It does not restore the session itself: that happens when a component
 * asks for it (`useSession`, `RequireAuth`), so pages that need no login (the login, consent and registration pages,
 * the callback) do not send a pointless refresh request. Put it inside `ConfigGate`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  useState(() => {
    configureApiClient()
    return null
  })

  useEffect(() => listenForLogout(), [])

  return <>{children}</>
}
