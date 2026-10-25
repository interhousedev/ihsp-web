"use client"

import { useCallback, useState } from "react"
import type { MindMapView } from "./mind-map-toolbar"

const STORAGE_KEY = "ihsp.notebooks.mindmap.view"
/** Below this width the canvas is unusable and the outline is the default (until the student chooses). */
const NARROWEST_CANVAS = 320

function readStored(): MindMapView | null {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY)
    return value === "map" || value === "outline" ? value : null
  } catch {
    return null
  }
}

function initialView(): MindMapView {
  if (typeof window === "undefined") return "map"
  return readStored() ?? (window.innerWidth < NARROWEST_CANVAS ? "outline" : "map")
}

/** Map or outline view; the choice is remembered for the browser session. */
export function useMindMapView() {
  const [view, setViewState] = useState<MindMapView>(initialView)

  const setView = useCallback((next: MindMapView) => {
    setViewState(next)
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode or blocked storage: the choice just is not remembered.
    }
  }, [])

  return [view, setView] as const
}
