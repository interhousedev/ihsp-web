"use client"

import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

export type HistoryEntry = { url: string; title: string }
export type HistoryState = { entries: HistoryEntry[]; index: number }

export const HISTORY_CAP = 50
export const HISTORY_RECENT = 10
export const HISTORY_STORAGE_KEY = "ihsp:history-nav"

export const EMPTY_HISTORY: HistoryState = { entries: [], index: -1 }

/** Visit a page. Re-visiting the current URL only refreshes its title; a visit after going back drops the forward entries. */
export function pushEntry(state: HistoryState, entry: HistoryEntry, cap: number = HISTORY_CAP): HistoryState {
  const current = state.entries[state.index]
  if (current && current.url === entry.url) {
    if (current.title === entry.title) return state
    const entries = state.entries.slice()
    entries[state.index] = entry
    return { entries, index: state.index }
  }
  let entries = [...state.entries.slice(0, state.index + 1), entry]
  if (entries.length > cap) entries = entries.slice(entries.length - cap)
  return { entries, index: entries.length - 1 }
}

export function goBack(state: HistoryState): HistoryState {
  return state.index > 0 ? { ...state, index: state.index - 1 } : state
}

export function goForward(state: HistoryState): HistoryState {
  return state.index < state.entries.length - 1 ? { ...state, index: state.index + 1 } : state
}

export function goToIndex(state: HistoryState, index: number): HistoryState {
  if (index < 0 || index >= state.entries.length) return state
  return { ...state, index }
}

export function canGoBack(state: HistoryState): boolean {
  return state.index > 0
}

export function canGoForward(state: HistoryState): boolean {
  return state.index >= 0 && state.index < state.entries.length - 1
}

/** The last `limit` entries before the current one (most recent first) or the next ones after it. */
export function recentBack(
  state: HistoryState,
  limit: number = HISTORY_RECENT,
): { entry: HistoryEntry; index: number }[] {
  const out: { entry: HistoryEntry; index: number }[] = []
  for (let i = state.index - 1; i >= 0 && out.length < limit; i--) out.push({ entry: state.entries[i]!, index: i })
  return out
}

export function recentForward(
  state: HistoryState,
  limit: number = HISTORY_RECENT,
): { entry: HistoryEntry; index: number }[] {
  const out: { entry: HistoryEntry; index: number }[] = []
  for (let i = state.index + 1; i < state.entries.length && out.length < limit; i++)
    out.push({ entry: state.entries[i]!, index: i })
  return out
}

function load(): HistoryState {
  try {
    const raw = window.sessionStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return EMPTY_HISTORY
    const parsed = JSON.parse(raw) as HistoryState
    if (!Array.isArray(parsed.entries) || typeof parsed.index !== "number") return EMPTY_HISTORY
    return { entries: parsed.entries.slice(-HISTORY_CAP), index: Math.min(parsed.index, parsed.entries.length - 1) }
  } catch {
    return EMPTY_HISTORY
  }
}

function save(state: HistoryState) {
  try {
    window.sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable (private mode, quota): history stays in memory
  }
}

/** Per-tab navigation history kept in sessionStorage (client cache, capped at 50). */
export function useHistoryStack() {
  const pathname = usePathname()
  const router = useRouter()
  const [state, setState] = useState<HistoryState>(EMPTY_HISTORY)
  const hydrated = useRef(false)
  const pending = useRef<string | null>(null)

  useEffect(() => {
    hydrated.current = true
    setState(load())
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    const url = `${pathname}${window.location.search}`
    if (pending.current === url) {
      pending.current = null
      return
    }
    const record = () =>
      setState((prev) => {
        const next = pushEntry(prev, { url, title: document.title || pathname })
        if (next !== prev) save(next)
        return next
      })
    record()
    // Next updates document.title after the route commits; refresh the entry's title once it has.
    const timer = window.setTimeout(record, 300)
    return () => window.clearTimeout(timer)
  }, [pathname])

  const stateRef = useRef(state)
  stateRef.current = state

  const move = useCallback(
    (index: number) => {
      const next = goToIndex(stateRef.current, index)
      if (next === stateRef.current) return
      const url = next.entries[next.index]!.url
      pending.current = url
      stateRef.current = next
      save(next)
      setState(next)
      router.push(url)
    },
    [router],
  )

  const back = useCallback(() => move(stateRef.current.index - 1), [move])
  const forward = useCallback(() => move(stateRef.current.index + 1), [move])

  return {
    state,
    canBack: canGoBack(state),
    canForward: canGoForward(state),
    backEntry: state.entries[state.index - 1] ?? null,
    forwardEntry: state.entries[state.index + 1] ?? null,
    recentBack: recentBack(state),
    recentForward: recentForward(state),
    back,
    forward,
    goTo: move,
  }
}
