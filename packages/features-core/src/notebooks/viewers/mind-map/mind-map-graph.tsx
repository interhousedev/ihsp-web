"use client"

import { memo } from "react"
import { branchColor } from "./branch-colors"
import type { MindMapLayout } from "./layout"
import { MindMapNode } from "./mind-map-node"

type MindMapGraphProps = {
  layout: MindMapLayout
  activeId: string
  selectedId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onFocusNode: (id: string) => void
  registerNode: (id: string, element: SVGGElement | null) => void
}

/**
 * The edges and nodes of the map. Memoized: panning and zooming only change the transform of the group around it, so
 * none of this re-renders while the user drags.
 */
export const MindMapGraph = memo(function MindMapGraph({
  layout,
  activeId,
  selectedId,
  onSelect,
  onToggle,
  onFocusNode,
  registerNode,
}: MindMapGraphProps) {
  return (
    <>
      <g data-slot="mind-map-edges" aria-hidden="true" fill="none">
        {layout.edges.map((edge) => (
          <path
            key={edge.id}
            d={edge.path}
            strokeWidth={2}
            strokeOpacity={0.7}
            strokeLinecap="round"
            style={{ stroke: branchColor(edge.branch) }}
          />
        ))}
      </g>
      <g data-slot="mind-map-nodes">
        {layout.nodes.map((item) => (
          <MindMapNode
            key={item.id}
            item={item}
            active={item.id === activeId}
            selected={item.id === selectedId}
            onSelect={onSelect}
            onToggle={onToggle}
            onFocusNode={onFocusNode}
            registerNode={registerNode}
          />
        ))}
      </g>
    </>
  )
})
