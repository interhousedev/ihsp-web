"use client"

import type { MindMapContent } from "@ihsp/api"
import { useCallback, useMemo, useState } from "react"
import { branchIds, buildTree, collapsedBeyond, toOutline } from "../../lib/tree"
import { layoutMindMap } from "./layout"
import { measureNode } from "./node-metrics"

/** The root and the first level are open at the start. */
const INITIAL_OPEN_LEVELS = 2

/** The tree of a mind map, which branches are collapsed, and the layout of what is visible. */
export function useMindMapTree(content: MindMapContent) {
  const tree = useMemo(() => buildTree(content.nodes), [content.nodes])
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() =>
    tree ? collapsedBeyond(tree, INITIAL_OPEN_LEVELS) : new Set(),
  )

  const layoutFor = useCallback(
    (ids: ReadonlySet<string>) => layoutMindMap(content.nodes, ids, measureNode),
    [content.nodes],
  )
  const layout = useMemo(() => layoutFor(collapsed), [layoutFor, collapsed])
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
    outline,
    allCollapsed,
  }
}

export type MindMapTreeState = ReturnType<typeof useMindMapTree>
