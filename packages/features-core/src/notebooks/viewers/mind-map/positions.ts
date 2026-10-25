import { boundsOf, edgePath, type MindMapLayout, type PositionedEdge, type PositionedNode } from "./layout"
import { measureText } from "./block-metrics"
import type { Point } from "./transform"
import type { TextBlock } from "./edit-state"

/** The layout with the dragged pills moved to where the student put them; edges follow their nodes. */
export function applyPositions(layout: MindMapLayout, positions: Readonly<Record<string, Point>>): MindMapLayout {
  if (Object.keys(positions).length === 0) return layout
  const nodes: PositionedNode[] = layout.nodes.map((item) => {
    const at = positions[item.id]
    return at ? { ...item, x: at.x, y: at.y } : item
  })
  const byId = new Map(nodes.map((item) => [item.id, item]))
  const edges: PositionedEdge[] = layout.edges.map((edge) => {
    const parent = byId.get(edge.from)
    const child = byId.get(edge.to)
    if (!parent || !child) return edge
    return {
      ...edge,
      path: edgePath(parent.x + parent.width, parent.y + parent.height / 2, child.x, child.y + child.height / 2),
    }
  })
  return { nodes, edges, bounds: boundsOf(nodes) }
}

export type PlacedBlock = TextBlock & {
  x: number
  y: number
  width: number
  height: number
  lines: string[]
}

/** Text blocks with their size and place: the dragged place, else a row under the map. */
export function placeBlocks(
  blocks: readonly TextBlock[],
  positions: Readonly<Record<string, Point>>,
  bounds: { x: number; y: number; width: number; height: number },
): PlacedBlock[] {
  let cursor = bounds.x
  return blocks.map((block) => {
    const size = measureText(block.text)
    const at = positions[block.id] ?? {
      x: cursor,
      y: bounds.y + bounds.height + 48,
    }
    cursor += size.width + 24
    return {
      ...block,
      x: at.x,
      y: at.y,
      width: size.width,
      height: size.height,
      lines: size.lines,
    }
  })
}
