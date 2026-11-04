"use client"

import { useCallback, useEffect, useState } from "react"

/** The two side panels (the chat is always there). */
export type SidePane = "sources" | "studio"

export type PaneState = {
  /** Desktop: which side panels are collapsed to the 56 px rail. Remembered across reloads. */
  collapsed: Record<SidePane, boolean>
  setCollapsed: (pane: SidePane, collapsed: boolean) => void
  toggleCollapsed: (pane: SidePane) => void
  /** Tablet: the side sheet that is open. */
  sheet: SidePane | null
  setSheet: (sheet: SidePane | null) => void
}

/** `localStorage` key of the collapsed side panels (a per-browser convenience). */
export const PANE_STORAGE_KEY = "ihsp.notebook.panes"

type Collapsed = Record<SidePane, boolean>

const EXPANDED: Collapsed = { sources: false, studio: false }

/** The stored choice, or everything expanded when the value is missing, malformed or storage is blocked. */
function read(): Collapsed {
  try {
    const raw = window.localStorage.getItem(PANE_STORAGE_KEY)
    if (!raw) return EXPANDED
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return EXPANDED
    const value = parsed as Partial<Record<SidePane, unknown>>
    return { sources: value.sources === true, studio: value.studio === true }
  } catch {
    return EXPANDED
  }
}

function write(value: Collapsed) {
  try {
    window.localStorage.setItem(PANE_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Blocked storage: the choice lasts until the page is closed.
  }
}

/**
 * Which side panels are collapsed (desktop) or open as a sheet (tablet). The chat needs no state. The collapsed choice
 * is read after mount (the server render and the first client render agree) and written on every change.
 */
export function usePaneState(): PaneState {
  const [collapsed, setCollapsedState] = useState<Collapsed>(EXPANDED)
  const [sheet, setSheet] = useState<SidePane | null>(null)

  useEffect(() => {
    setCollapsedState(read())
  }, [])

  const setCollapsed = useCallback((pane: SidePane, value: boolean) => {
    setCollapsedState((current) => {
      if (current[pane] === value) return current
      const next = { ...current, [pane]: value }
      write(next)
      return next
    })
  }, [])
  const toggleCollapsed = useCallback((pane: SidePane) => {
    setCollapsedState((current) => {
      const next = { ...current, [pane]: !current[pane] }
      write(next)
      return next
    })
  }, [])

  return { collapsed, setCollapsed, toggleCollapsed, sheet, setSheet }
}
