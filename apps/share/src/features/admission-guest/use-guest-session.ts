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

// One exchange per page load: StrictMode runs effects twice, the first run strips the hash and the
// link token may be single-use, so both runs share the same read and request until it settles.
let pending: { hash: string; result: Promise<{ token: string; view: GuestView }> } | null = null

function readLinkOnce(): typeof pending {
  if (pending) return pending
  const hash = window.location.hash.replace(/^#/, "")
  if (hash) window.history.replaceState(null, "", window.location.pathname + window.location.search)
  if (!hash.startsWith(LINK_TOKEN_PREFIX)) return null
  pending = {
    hash,
    result: (async () => {
      const { token } = await exchangeGuestToken(hash)
      const view = await fetchGuestView(token)
      return { token, view }
    })().finally(() => {
      pending = null
    }),
  }
  return pending
}

/**
 * Reads the link token from the URL fragment (never the query string, so it stays out of server logs and Referer),
 * removes it from the address bar at once and keeps the session token in memory only.
 */
export function useGuestSession(): { state: GuestState; setView: (view: GuestView) => void } {
  const [state, setState] = useState<GuestState>({ kind: "loading" })

  useEffect(() => {
    const link = readLinkOnce()
    if (!link) {
      setState({ kind: "missing" })
      return
    }
    let active = true
    link.result.then(
      ({ token, view }) => {
        if (active) setState({ kind: "ready", session: token, view })
      },
      (error: unknown) => {
        if (!active) return
        if (isApiError(error) && (error.status === 401 || error.status === 404 || error.status === 410))
          setState({ kind: "unavailable" })
        else if (isApiError(error) && error.status === 429) setState({ kind: "limited" })
        else setState({ kind: "error", error })
      },
    )
    return () => {
      active = false
    }
  }, [])

  return {
    state,
    setView: (view) => setState((current) => (current.kind === "ready" ? { ...current, view } : current)),
  }
}
