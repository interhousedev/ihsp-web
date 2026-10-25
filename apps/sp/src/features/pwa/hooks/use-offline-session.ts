"use client"

import { getIdMe } from "@ihsp/api"
import { refresh, setSession, useAuthStore } from "@ihsp/auth"
import { useEffect } from "react"
import { OFFLINE_TOKEN, loadOfflineSession, saveOfflineSession } from "../utils/offline-session"

/**
 * The installed app must start without the network. The access token only lives in memory, so a cold start offline
 * cannot refresh it and `RequireAuth` would show "you are offline". Instead the last signed-in user (remembered for
 * 7 days) is put back with a placeholder token: the pages show what the query cache and the service worker have. The
 * first request that reaches the server gets a 401, which refreshes the session with the cookie; the `online` event
 * does the same at once and then reloads the real profile. A refresh the server rejects ends the session as usual.
 */
export function useOfflineSession(): void {
  const status = useAuthStore((state) => state.status)
  const networkError = useAuthStore((state) => state.networkError)
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isPlaceholder = token?.access_token === OFFLINE_TOKEN

  useEffect(() => {
    if (status === "authenticated" && user && !isPlaceholder) saveOfflineSession(user)
  }, [status, user, isPlaceholder])

  useEffect(() => {
    if (status !== "loading" || !networkError) return
    const remembered = loadOfflineSession()
    if (!remembered) return
    // Already expired, so the first call for a token goes to the refresh endpoint.
    setSession({ access_token: OFFLINE_TOKEN, expires_at: Date.now(), user: remembered })
  }, [status, networkError])

  useEffect(() => {
    if (!isPlaceholder) return
    const restore = async () => {
      if (!(await refresh())) return
      try {
        useAuthStore.getState().setUser(await getIdMe())
      } catch {
        // The token works; the profile is reloaded with the next page.
      }
    }
    const onOnline = () => void restore()
    window.addEventListener("online", onOnline)
    return () => window.removeEventListener("online", onOnline)
  }, [isPlaceholder])
}
