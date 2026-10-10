"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import type { MouseEvent } from "react"
import type { MindMapLayout } from "./layout"
import type { PlacedBlock } from "./positions"
import { MindMapGraph } from "./mind-map-graph"
import { transformCss } from "./transform"
import type { useMindMapNavigation } from "./use-mind-map-navigation"
import type { usePanZoom } from "./use-pan-zoom"

type MindMapCanvasProps = {
  title: string
  layout: MindMapLayout
  panZoom: ReturnType<typeof usePanZoom>
  nav: ReturnType<typeof useMindMapNavigation>
  blocks: readonly PlacedBlock[]
  onEdit: (id: string) => void
  onEditBlock: (id: string) => void
}

/**
 * The pannable, zoomable SVG. The whole map hangs in one group whose transform follows the pointer; the graph inside is
 * memoized, so dragging never re-renders the nodes. The SVG is a `tree` (see the keyboard model in `keyboard-nav.ts`).
 */
export function MindMapCanvas({ title, layout, panZoom, nav, blocks, onEdit, onEditBlock }: MindMapCanvasProps) {
  const t = useT("notebooks")

  function onBackgroundClick(event: MouseEvent<SVGSVGElement>) {
    // A click on empty canvas closes the details; the click that ends a drag does not.
    if (event.target === event.currentTarget && !panZoom.wasDragged()) nav.clearSelection()
  }

  const { attach, transform, animated, dragging } = panZoom
  const cursor = dragging ? "cursor-grabbing" : "cursor-grab"

  return (
    <div ref={attach} data-slot="mind-map-canvas" className={cn("absolute inset-0 touch-none overflow-hidden", cursor)}>
      <svg
        role="tree"
        tabIndex={-1}
        aria-label={t("mindmap.canvas", { title })}
        className="size-full select-none"
        onKeyDown={nav.onKeyDown}
        onClick={onBackgroundClick}
      >
        <g
          data-slot="mind-map-viewport"
          className={cn(animated && "motion-safe:transition-transform motion-safe:duration-200")}
          style={{ transform: transformCss(transform), transformOrigin: "0 0" }}
        >
          <MindMapGraph
            layout={layout}
            activeId={nav.activeId}
            selectedId={nav.selectedId}
            onSelect={nav.onSelect}
            onToggle={nav.onToggle}
            onFocusNode={nav.onFocusNode}
            onEdit={onEdit}
            blocks={blocks}
            onEditBlock={onEditBlock}
            registerNode={nav.registerNode}
          />
        </g>
      </svg>
    </div>
  )
}
