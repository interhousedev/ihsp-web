"use client"

import { useEffect } from "react"

/**
 * A web search query asked for by the Studio ("not enough material"). The Discover box of the Sources pane takes it
 * as its text; nothing is searched until the student sends it. A request made before the box is mounted (a phone
 * opening the Sources tab) waits for the next mount.
 */
type Listener = (query: string) => void

const listeners = new Set<Listener>()
let waiting: string | null = null

export function requestWebSearch(query: string): void {
  if (listeners.size === 0) {
    waiting = query
    return
  }
  waiting = null
  for (const listen of listeners) listen(query)
}

/** Calls `onQuery` with a waiting or new request; the box uses it to fill its text field. */
export function useWebSearchPrefill(onQuery: Listener): void {
  useEffect(() => {
    if (waiting !== null) {
      const query = waiting
      waiting = null
      onQuery(query)
    }
    listeners.add(onQuery)
    return () => {
      listeners.delete(onQuery)
    }
  }, [onQuery])
}
