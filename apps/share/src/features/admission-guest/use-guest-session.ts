"use client"

import { isApiError } from "@ihsp/api"
import { useEffect, useState } from "react"
import { exchangeGuestToken, fetchGuestView, LINK_TOKEN_PREFIX, type GuestView } from "./api"

export type GuestState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "unavailable" }
  | { kind: "limited" }
  | { kind: "error"; error: unknown }
  | { kind: "ready"; session: string; view: GuestView }

/**
 * Reads the link token from the URL fragment (never the query string, so it stays out of server logs and Referer),
 * removes it from the address bar at once and keeps the session token in memory only.
 */
export function useGuestSession(): { state: GuestState; setView: (view: GuestView) => void } {
  const [state, setState] = useState<GuestState>({ kind: "loading" })

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "")
    if (hash) window.history.replaceState(null, "", window.location.pathname + window.location.search)
    if (!hash.startsWith(LINK_TOKEN_PREFIX)) {
      setState({ kind: "missing" })
      return
    }
    const controller = new AbortController()
    void (async () => {
      try {
        const { token } = await exchangeGuestToken(hash, controller.signal)
        const view = await fetchGuestView(token, controller.signal)
        setState({ kind: "ready", session: token, view })
      } catch (error) {
        if (controller.signal.aborted) return
        if (isApiError(error) && (error.status === 401 || error.status === 404 || error.status === 410))
          setState({ kind: "unavailable" })
        else if (isApiError(error) && error.status === 429) setState({ kind: "limited" })
        else setState({ kind: "error", error })
      }
    })()
    return () => controller.abort()
  }, [])

  return {
    state,
    setView: (view) => setState((current) => (current.kind === "ready" ? { ...current, view } : current)),
  }
}
