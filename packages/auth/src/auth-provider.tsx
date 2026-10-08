"use client"

import { useEffect, useState, type ReactNode } from "react"
import { listenForLogout } from "./channel"
import { bootstrapSession, configureApiClient } from "./session"

/**
 * Wires the API client to the auth store (before any child renders, so the first request already has a token
 * source), restores the session and follows logouts from other tabs. Put it inside `ConfigGate`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  useState(() => {
    configureApiClient()
    return null
  })

  useEffect(() => {
    void bootstrapSession()
    return listenForLogout()
  }, [])

  return <>{children}</>
}
