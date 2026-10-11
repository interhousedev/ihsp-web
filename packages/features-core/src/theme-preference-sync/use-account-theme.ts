"use client"

import { getMe, keys, type UserMe } from "@ihsp/api"
import { getSession, useAuthStore } from "@ihsp/auth"
import { isMiniApp } from "@ihsp/telegram/core"
import { isThemeChoice, useTheme } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"

/** A window that gets focus again asks the account for its theme at most this often. */
export const THEME_REFETCH_MIN_MS = 15_000

/**
 * Makes the account's `preferences.theme` the theme of this page: applied (and cached by next-themes in localStorage)
 * when the session has loaded or the logged-in user changes, and again when the user comes back to the window, because
 * another platform (separate subdomain, separate localStorage) may have changed it meanwhile.
 * In a Telegram mini app the theme belongs to Telegram, so nothing is applied there.
 */
export function useAccountTheme(): void {
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const userId = useAuthStore((state) => state.user?.id)
  const accountTheme = useAuthStore((state) => state.user?.preferences.theme)

  // Read inside the effects without re-running them: only a change of the account should (re)apply its theme.
  const current = useRef(theme)
  current.current = theme

  useEffect(() => {
    if (!userId || !isThemeChoice(accountTheme) || isMiniApp()) return
    if (current.current !== accountTheme) setTheme(accountTheme)
  }, [userId, accountTheme, setTheme])

  useEffect(() => {
    if (!userId || isMiniApp()) return
    let lastAsked = Date.now()

    async function takeAccountTheme(): Promise<void> {
      if (document.visibilityState === "hidden" || Date.now() - lastAsked < THEME_REFETCH_MIN_MS) return
      lastAsked = Date.now()
      // A save in flight would be overwritten by the older answer of the server.
      if (queryClient.isMutating() > 0) return
      let fresh: UserMe
      try {
        fresh = await getMe()
      } catch {
        return // Offline or logged out: the session handling deals with it; the current theme stays.
      }
      const session = getSession()
      if (!session || session.user.id !== fresh.id || queryClient.isMutating() > 0) return
      const next = fresh.preferences.theme
      if (session.user.preferences.theme === next) return
      useAuthStore.getState().setUser({ ...session.user, preferences: { ...session.user.preferences, theme: next } })
      queryClient.setQueryData<UserMe>(keys.id.me(), (cached) =>
        cached ? { ...cached, preferences: { ...cached.preferences, theme: next } } : cached,
      )
    }

    const onVisible = () => void takeAccountTheme()
    window.addEventListener("focus", onVisible)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.removeEventListener("focus", onVisible)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [userId, queryClient])
}
