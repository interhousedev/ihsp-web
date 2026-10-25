"use client"

import { useCallback, useState } from "react"

/** The two side panels (the chat is always there). */
export type SidePane = "sources" | "studio"

export type PaneState = {
  /** Desktop: which side panels are collapsed to the 56 px rail. */
  collapsed: Record<SidePane, boolean>
  setCollapsed: (pane: SidePane, collapsed: boolean) => void
  toggleCollapsed: (pane: SidePane) => void
  /** Tablet: the side sheet that is open. */
  sheet: SidePane | null
  setSheet: (sheet: SidePane | null) => void
}

/** Which side panels are collapsed (desktop) or open as a sheet (tablet). The chat needs no state. */
export function usePaneState(): PaneState {
  const [collapsed, setCollapsedState] = useState<Record<SidePane, boolean>>({ sources: false, studio: false })
  const [sheet, setSheet] = useState<SidePane | null>(null)

  const setCollapsed = useCallback((pane: SidePane, value: boolean) => {
    setCollapsedState((current) => (current[pane] === value ? current : { ...current, [pane]: value }))
  }, [])
  const toggleCollapsed = useCallback((pane: SidePane) => {
    setCollapsedState((current) => ({ ...current, [pane]: !current[pane] }))
  }, [])

  return { collapsed, setCollapsed, toggleCollapsed, sheet, setSheet }
}
