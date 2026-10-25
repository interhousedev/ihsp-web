"use client"

import { useState, type DragEvent } from "react"

/** True when the drag carries files (not text or links), so only file drops are taken. */
export function carriesFiles(event: DragEvent): boolean {
  const transfer = event.dataTransfer
  return Array.from(transfer?.types ?? []).includes("Files") || (transfer?.files?.length ?? 0) > 0
}

/**
 * Drag-and-drop of files onto an element. `dragging` is true while files hover over it (a counter keeps it steady
 * while the pointer crosses child elements). Dropped files go to `onFiles` at once, with no confirmation.
 */
export function useFileDrop(onFiles: (files: File[]) => void, enabled = true) {
  const [depth, setDepth] = useState(0)
  if (!enabled && depth !== 0) setDepth(0)

  return {
    dragging: enabled && depth > 0,
    handlers: {
      onDragEnter(event: DragEvent) {
        if (!enabled || !carriesFiles(event)) return
        event.preventDefault()
        setDepth((count) => count + 1)
      },
      onDragOver(event: DragEvent) {
        if (!enabled || !carriesFiles(event)) return
        event.preventDefault()
      },
      onDragLeave(event: DragEvent) {
        if (!enabled || !carriesFiles(event)) return
        setDepth((count) => Math.max(0, count - 1))
      },
      onDrop(event: DragEvent) {
        if (!enabled || !carriesFiles(event)) return
        event.preventDefault()
        setDepth(0)
        onFiles(Array.from(event.dataTransfer.files))
      },
    },
  }
}
