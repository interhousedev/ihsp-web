"use client"

import { useSyncExternalStore } from "react"

/** `desktop`: three panes, `tablet`: chat plus side sheets, `phone`: three tabs. */
export type WorkspaceLayout = "desktop" | "tablet" | "phone"

export const DESKTOP_MIN_WIDTH = 1280
export const TABLET_MIN_WIDTH = 768

export function layoutForWidth(width: number): WorkspaceLayout {
  if (width >= DESKTOP_MIN_WIDTH) return "desktop"
  if (width >= TABLET_MIN_WIDTH) return "tablet"
  return "phone"
}

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange)
  return () => window.removeEventListener("resize", onChange)
}

const getSnapshot = () => layoutForWidth(window.innerWidth)
const getServerSnapshot = (): WorkspaceLayout => "desktop"

/** The layout for the current window width; follows resizes. Desktop while prerendering. */
export function useWorkspaceLayout(): WorkspaceLayout {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
