"use client"

import { isApiError } from "@ihsp/api"
import { useEffect, useState } from "react"
import { openReview, type ReviewView } from "./api"

export type ReviewState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "limited" }
  | { kind: "error"; error: unknown }
  | { kind: "ready"; token: string; view: ReviewView }

// StrictMode runs effects twice and the first run strips the fragment: both runs share one read and one request.
let pending: { token: string; result: Promise<ReviewView> } | null = null

function readOnce(): typeof pending {
  if (pending) return pending
  const token = window.location.hash.replace(/^#/, "")
  if (token) window.history.replaceState(null, "", window.location.pathname + window.location.search)
  if (!token) return null
  pending = { token, result: openReview(token).finally(() => (pending = null)) }
  return pending
}

/** Reads the token from the fragment only, clears it from the address bar and keeps it in memory. */
export function useReview(): { state: ReviewState; addComment: (comment: ReviewView["comments"][number]) => void } {
  const [state, setState] = useState<ReviewState>({ kind: "loading" })

  useEffect(() => {
    const link = readOnce()
    if (!link) {
      setState({ kind: "missing" })
      return
    }
    let active = true
    link.result.then(
      (view) => active && setState({ kind: "ready", token: link.token, view }),
      (error: unknown) => {
        if (!active) return
        if (isApiError(error) && error.status === 429) setState({ kind: "limited" })
        else if (isApiError(error) && (error.status === 404 || error.status === 410 || error.status === 401))
          setState({ kind: "missing" })
        else setState({ kind: "error", error })
      },
    )
    return () => {
      active = false
    }
  }, [])

  return {
    state,
    addComment: (comment) =>
      setState((current) =>
        current.kind === "ready"
          ? { ...current, view: { ...current.view, comments: [...current.view.comments, comment] } }
          : current,
      ),
  }
}
