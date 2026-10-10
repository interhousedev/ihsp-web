"use client"

import type { MindMapNode } from "@ihsp/api"
import { useCallback, useMemo, useState } from "react"
import { branchIds, buildTree, collapsedBeyond, toOutline } from "../../lib/tree"
import type { Point } from "./transform"
import { layoutMindMap } from "./layout"
import { measureNode } from "./node-metrics"
import { applyPositions } from "./positions"

/** The root and the first level are open at the start. */
const INITIAL_OPEN_LEVELS = 2

/**
 * The tree of a mind map, which branches are collapsed, and the layout of what is visible: the automatic layout of
 * `nodes` with the pills the student dragged moved to their `positions`.
 */
export function useMindMapTree(nodes: readonly MindMapNode[], positions: Readonly<Record<string, Point>> = {}) {
  const tree = useMemo(() => buildTree(nodes), [nodes])
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() =>
    tree ? collapsedBeyond(tree, INITIAL_OPEN_LEVELS) : new Set(),
  )

  const layoutFor = useCallback(
    (ids: ReadonlySet<string>) => applyPositions(layoutMindMap(nodes, ids, measureNode), positions),
    [nodes, positions],
  )
  const layout = useMemo(() => layoutFor(collapsed), [layoutFor, collapsed])
  /** The tidy layout, ignoring every dragged position (what «Сжать» goes back to). */
  const tidyFor = useCallback((ids: ReadonlySet<string>) => layoutMindMap(nodes, ids, measureNode), [nodes])
  const outline = useMemo(() => (tree ? toOutline(tree) : ""), [tree])
  /** Every branch closed except the root, so that the first level stays visible. */
  const allCollapsed = useMemo<ReadonlySet<string>>(
    () => new Set(tree ? branchIds(tree).filter((id) => id !== tree.node.id) : []),
    [tree],
  )

  return {
    tree,
    rootId: tree?.node.id ?? null,
    collapsed,
    setCollapsed,
    layout,
    layoutFor,
    tidyFor,
    outline,
    allCollapsed,
  }
}

export type MindMapTreeState = ReturnType<typeof useMindMapTree>
