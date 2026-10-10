"use client"

import { memo } from "react"
import { branchColor } from "./branch-colors"
import type { MindMapLayout } from "./layout"
import { MindMapBlock } from "./mind-map-block"
import { MindMapNode } from "./mind-map-node"
import type { PlacedBlock } from "./positions"

type MindMapGraphProps = {
  layout: MindMapLayout
  activeId: string
  selectedId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onFocusNode: (id: string) => void
  onEdit: (id: string) => void
  blocks: readonly PlacedBlock[]
  onEditBlock: (id: string) => void
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
  onEdit,
  blocks,
  onEditBlock,
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
            onEdit={onEdit}
            registerNode={registerNode}
          />
        ))}
      </g>
      <g data-slot="mind-map-blocks">
        {blocks.map((block) => (
          <MindMapBlock key={block.id} block={block} onEdit={onEditBlock} />
        ))}
      </g>
    </>
  )
})
