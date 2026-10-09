"use client"

import { cn, ResizablePanel } from "@ihsp/ui"
import { useEffect, useRef, type ReactNode } from "react"
import { usePanelRef, type PanelSize } from "react-resizable-panels"

export const RAIL_WIDTH = 56

type CollapsiblePaneProps = {
  id: string
  /** Pixel sizes (the spec: Sources 320 / min 260, Studio 360 / min 300). */
  defaultSize: number
  minSize: number
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  /** The 56 px rail shown while collapsed. */
  rail: ReactNode
  /** The pane, shown while expanded. */
  children: ReactNode
}

/**
 * A resizable side panel that collapses to a rail. The React state `collapsed` drives what is rendered; the library's
 * panel follows it (and reports back when the user drags the handle past the minimum).
 */
export function CollapsiblePane({
  id,
  defaultSize,
  minSize,
  collapsed,
  onCollapsedChange,
  rail,
  children,
}: CollapsiblePaneProps) {
  const panelRef = usePanelRef()
  const synced = useRef(collapsed)

  useEffect(() => {
    if (synced.current === collapsed) return
    synced.current = collapsed
    const panel = panelRef.current
    if (!panel) return
    if (collapsed) panel.collapse()
    else panel.expand()
  }, [collapsed, panelRef])

  function handleResize(size: PanelSize) {
    // Zero pixels means the group is not measured yet (first render, tests).
    if (size.inPixels <= 0) return
    const isCollapsed = size.inPixels <= RAIL_WIDTH + 1
    synced.current = isCollapsed
    onCollapsedChange(isCollapsed)
  }

  return (
    <ResizablePanel
      id={id}
      panelRef={panelRef}
      defaultSize={defaultSize}
      minSize={minSize}
      collapsible
      collapsedSize={RAIL_WIDTH}
      groupResizeBehavior="preserve-pixel-size"
      onResize={handleResize}
      className={cn("flex min-w-0 flex-col print:hidden", collapsed && "bg-muted/30")}
      style={{ overflow: "hidden" }}
    >
      {collapsed ? rail : children}
    </ResizablePanel>
  )
}
