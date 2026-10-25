import type { MindMapNode } from "@ihsp/api"

export type TreeNode = {
  node: MindMapNode
  depth: number
  /** Index of the first-level branch the node belongs to (the root and `null` for the root itself). */
  branch: number | null
  children: TreeNode[]
}

/**
 * Builds the tree of a flat mind map (`parent_id` links). Children keep their order in the list. Nodes whose parent
 * is missing or that sit in a cycle are dropped. Returns `null` when there is no root.
 */
export function buildTree(nodes: readonly MindMapNode[]): TreeNode | null {
  const root = nodes.find((node) => node.parent_id === null)
  if (!root) return null
  const childrenOf = new Map<string, MindMapNode[]>()
  for (const node of nodes) {
    if (node.parent_id === null) continue
    const list = childrenOf.get(node.parent_id) ?? []
    list.push(node)
    childrenOf.set(node.parent_id, list)
  }
  const visited = new Set<string>()
  function build(node: MindMapNode, depth: number, branch: number | null): TreeNode {
    visited.add(node.id)
    const children = (childrenOf.get(node.id) ?? [])
      .filter((child) => !visited.has(child.id))
      .map((child, index) => build(child, depth + 1, depth === 0 ? index : branch))
    return { node, depth, branch, children }
  }
  return build(root, 0, null)
}

/** Depth of the deepest node (the root has depth 0). */
export function treeDepth(tree: TreeNode): number {
  return tree.children.reduce((max, child) => Math.max(max, treeDepth(child)), tree.depth)
}

/** Number of nodes in the tree. */
export function countNodes(tree: TreeNode): number {
  return 1 + tree.children.reduce((sum, child) => sum + countNodes(child), 0)
}

/** Ids of every node that has children (those can be collapsed). */
export function branchIds(tree: TreeNode): string[] {
  const ids: string[] = []
  function walk(item: TreeNode) {
    if (item.children.length > 0) ids.push(item.node.id)
    item.children.forEach(walk)
  }
  walk(tree)
  return ids
}

/** Ids of the nodes that start collapsed so that only the first `levels` levels are open. */
export function collapsedBeyond(tree: TreeNode, levels: number): Set<string> {
  const collapsed = new Set<string>()
  function walk(item: TreeNode) {
    if (item.children.length > 0 && item.depth >= levels - 1) collapsed.add(item.node.id)
    item.children.forEach(walk)
  }
  walk(tree)
  return collapsed
}

/** Indented Markdown outline of the tree, for the list view and the Markdown download. */
export function toOutline(tree: TreeNode): string {
  const lines: string[] = []
  function walk(item: TreeNode) {
    lines.push(`${"  ".repeat(item.depth)}- ${item.node.label}`)
    item.children.forEach(walk)
  }
  walk(tree)
  return lines.join("\n")
}
