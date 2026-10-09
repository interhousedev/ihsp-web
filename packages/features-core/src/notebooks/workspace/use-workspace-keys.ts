"use client"

import { useEffect, useRef } from "react"
import type { SidePane } from "./use-pane-state"

/** Popups that own the Escape key while open. */
const OVERLAYS = [
  "dialog-content",
  "alert-dialog-content",
  "sheet-content",
  "drawer-content",
  "popover-content",
  "dropdown-menu-content",
  "select-content",
]
  .map((slot) => `[data-slot="${slot}"][data-open]`)
  .join(",")

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

type WorkspaceKeys = {
  /** `[` and `]` collapse the side panes on a desktop. */
  collapsePanes: boolean
  viewerOpen: boolean
  onCloseViewer: () => void
  onToggle: (pane: SidePane) => void
  /** `/`: show the chat and put the cursor in the composer. */
  onFocusComposer: () => void
}

/** Workspace shortcuts (docs/reference/notebooklm.md § 5.7): `/` composer, `[` and `]` panes, Esc closes a viewer. */
export function useWorkspaceKeys(options: WorkspaceKeys): void {
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const { collapsePanes, viewerOpen, onCloseViewer, onToggle, onFocusComposer } = latest.current
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return

      if (event.key === "Escape") {
        if (!viewerOpen || isEditable(event.target) || document.querySelector(OVERLAYS)) return
        event.preventDefault()
        onCloseViewer()
        return
      }

      if (isEditable(event.target)) return
      if (event.key === "/") {
        event.preventDefault()
        onFocusComposer()
      } else if (collapsePanes && event.key === "[") {
        event.preventDefault()
        onToggle("sources")
      } else if (collapsePanes && event.key === "]") {
        event.preventDefault()
        onToggle("studio")
      }
    }
    // Capture phase: an open popup is still in the DOM when its own Escape handling has not run yet.
    document.addEventListener("keydown", onKeyDown, true)
    return () => document.removeEventListener("keydown", onKeyDown, true)
  }, [])
}
