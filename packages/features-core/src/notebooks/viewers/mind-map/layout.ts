import type { MindMapNode } from "@ihsp/api"
import { buildTree, type TreeNode } from "../../lib/tree"

export type NodeSize = { width: number; height: number }

/** Size of a node's pill in layout units (pixels at zoom 1). */
export type MeasureNode = (node: MindMapNode) => NodeSize

export type LayoutOptions = {
  /** Horizontal space between two columns (room for the edges and the expand control). */
  columnGap?: number
  /** Vertical space between two stacked siblings (and between neighbouring subtrees). */
  rowGap?: number
}

export const DEFAULT_COLUMN_GAP = 64
export const DEFAULT_ROW_GAP = 14

export type PositionedNode = {
  id: string
  node: MindMapNode
  parentId: string | null
  /** Left edge of the pill. All pills of one depth share the same `x`. */
  x: number
  /** Top edge of the pill. */
  y: number
  width: number
  height: number
  /** 0 for the root. */
  depth: number
  /** Index of the first-level branch (colour), `null` for the root. */
  branch: number | null
  hasChildren: boolean
  /** Has children that are hidden. */
  collapsed: boolean
  /** 1-based position among the siblings, for `aria-posinset`. */
  position: number
  /** Number of siblings including the node itself, for `aria-setsize`. */
  siblings: number
}

export type PositionedEdge = {
  id: string
  from: string
  to: string
  /** Branch of the child (colour of the edge). */
  branch: number | null
  /** SVG path data: a smooth cubic Bezier from the right edge of the parent to the left edge of the child. */
  path: string
}

export type Bounds = { x: number; y: number; width: number; height: number }

export type MindMapLayout = {
  /** Visible nodes in depth-first order (the reading order of the tree). */
  nodes: PositionedNode[]
  edges: PositionedEdge[]
  /** Tight box around every visible pill. */
  bounds: Bounds
}

const EMPTY_BOUNDS: Bounds = { x: 0, y: 0, width: 0, height: 0 }

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/** A horizontal cubic Bezier between two anchor points. */
export function edgePath(fromX: number, fromY: number, toX: number, toY: number): string {
  const middle = (fromX + toX) / 2
  return `M ${round(fromX)} ${round(fromY)} C ${round(middle)} ${round(fromY)}, ${round(middle)} ${round(toY)}, ${round(toX)} ${round(toY)}`
}

/**
 * Lays out a mind map as a horizontal tree: the root at the left, one column per depth, siblings stacked
 * vertically, every parent centred on its visible children. Nodes in `collapsedIds` hide their descendants. Pure and
 * deterministic: the same input gives the same output.
 *
 * Every subtree owns a vertical block as tall as its children, so two nodes of one column never overlap.
 */
export function layoutMindMap(
  nodes: readonly MindMapNode[],
  collapsedIds: ReadonlySet<string>,
  measure: MeasureNode,
  options: LayoutOptions = {},
): MindMapLayout {
  const columnGap = options.columnGap ?? DEFAULT_COLUMN_GAP
  const rowGap = options.rowGap ?? DEFAULT_ROW_GAP
  const tree = buildTree(nodes)
  if (!tree) return { nodes: [], edges: [], bounds: EMPTY_BOUNDS }

  const visibleChildren = (item: TreeNode): TreeNode[] => (collapsedIds.has(item.node.id) ? [] : item.children)

  // Pass 1: sizes, and the width of every column.
  const sizes = new Map<string, NodeSize>()
  const columnWidths: number[] = []
  function measureAll(item: TreeNode) {
    const size = measure(item.node)
    sizes.set(item.node.id, size)
    columnWidths[item.depth] = Math.max(columnWidths[item.depth] ?? 0, size.width)
    visibleChildren(item).forEach(measureAll)
  }
  measureAll(tree)

  const columnX: number[] = []
  columnWidths.forEach((_width, depth) => {
    columnX[depth] = depth === 0 ? 0 : (columnX[depth - 1] ?? 0) + (columnWidths[depth - 1] ?? 0) + columnGap
  })

  // Pass 2: the height of every subtree block.
  const blockHeights = new Map<string, number>()
  const spanOf = (children: TreeNode[]): number =>
    children.reduce((sum, child) => sum + (blockHeights.get(child.node.id) ?? 0), 0) +
    rowGap * Math.max(0, children.length - 1)
  function measureBlock(item: TreeNode): number {
    const children = visibleChildren(item)
    children.forEach(measureBlock)
    const height = Math.max(sizes.get(item.node.id)?.height ?? 0, spanOf(children))
    blockHeights.set(item.node.id, height)
    return height
  }
  measureBlock(tree)

  // Pass 3: positions, depth first.
  const positioned: PositionedNode[] = []
  const byId = new Map<string, PositionedNode>()
  function place(item: TreeNode, top: number, parentId: string | null, position: number, siblings: number) {
    const size = sizes.get(item.node.id) ?? { width: 0, height: 0 }
    const block = blockHeights.get(item.node.id) ?? size.height
    const children = visibleChildren(item)
    const entry: PositionedNode = {
      id: item.node.id,
      node: item.node,
      parentId,
      x: columnX[item.depth] ?? 0,
      y: top,
      width: size.width,
      height: size.height,
      depth: item.depth,
      branch: item.branch,
      hasChildren: item.children.length > 0,
      collapsed: item.children.length > 0 && children.length === 0,
      position,
      siblings,
    }
    positioned.push(entry)
    byId.set(entry.id, entry)
    if (children.length === 0) return

    let cursor = top + (block - spanOf(children)) / 2
    children.forEach((child, index) => {
      place(child, cursor, entry.id, index + 1, children.length)
      cursor += (blockHeights.get(child.node.id) ?? 0) + rowGap
    })
    const first = byId.get(children[0]?.node.id ?? "")
    const last = byId.get(children[children.length - 1]?.node.id ?? "")
    if (!first || !last) return
    const centre = (first.y + first.height / 2 + last.y + last.height / 2) / 2
    entry.y = Math.min(Math.max(centre - size.height / 2, top), top + block - size.height)
  }
  place(tree, 0, null, 1, 1)

  const edges: PositionedEdge[] = []
  for (const entry of positioned) {
    const parent = entry.parentId ? byId.get(entry.parentId) : undefined
    if (!parent) continue
    edges.push({
      id: `${parent.id}->${entry.id}`,
      from: parent.id,
      to: entry.id,
      branch: entry.branch,
      path: edgePath(parent.x + parent.width, parent.y + parent.height / 2, entry.x, entry.y + entry.height / 2),
    })
  }

  return { nodes: positioned, edges, bounds: boundsOf(positioned) }
}

function boundsOf(items: readonly PositionedNode[]): Bounds {
  if (items.length === 0) return EMPTY_BOUNDS
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const item of items) {
    minX = Math.min(minX, item.x)
    minY = Math.min(minY, item.y)
    maxX = Math.max(maxX, item.x + item.width)
    maxY = Math.max(maxY, item.y + item.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
