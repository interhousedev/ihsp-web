/** A row of a parent-linked tree (topics, subjects). `position` orders the siblings. */
export type TreeItem = { id: string; parent_id: string | null; position: number }
export type TreeNode<T> = T & { children: TreeNode<T>[] }

/**
 * The flat rows as a tree, children in `position` order. A row whose parent is missing from the list (filtered out or
 * deleted) is shown as a root rather than lost.
 */
export function buildTree<T extends TreeItem>(flat: readonly T[]): TreeNode<T>[] {
  const nodes = new Map<string, TreeNode<T>>(flat.map((row) => [row.id, { ...row, children: [] }]))
  const roots: TreeNode<T>[] = []
  for (const row of flat.toSorted((a, b) => a.position - b.position)) {
    const node = nodes.get(row.id)
    if (!node) continue
    const parent = row.parent_id ? nodes.get(row.parent_id) : undefined
    if (parent && parent.id !== node.id) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

/** How many rows a delete removes besides the row itself (the API deletes the whole subtree). */
export function descendantCount<T>(node: TreeNode<T>): number {
  return node.children.reduce((sum, child) => sum + 1 + descendantCount(child), 0)
}

/** Every id in the subtree of `id`, `id` included (a parent cannot be moved under its own descendants). */
export function subtreeIds<T extends TreeItem>(flat: readonly T[], id: string): Set<string> {
  const ids = new Set<string>([id])
  let grew = true
  while (grew) {
    grew = false
    for (const row of flat) {
      if (row.parent_id && ids.has(row.parent_id) && !ids.has(row.id)) {
        ids.add(row.id)
        grew = true
      }
    }
  }
  return ids
}

/**
 * The position changes that move `id` one step up (`-1`) or down (`1`) among its siblings. The siblings are renumbered
 * 0..n-1, so only the rows whose position changes are returned; an empty list means the move is at an edge.
 */
export function reorderPatches(
  flat: readonly TreeItem[],
  id: string,
  direction: -1 | 1,
): { id: string; position: number }[] {
  const target = flat.find((row) => row.id === id)
  if (!target) return []
  const siblings = flat.filter((row) => row.parent_id === target.parent_id).toSorted((a, b) => a.position - b.position)
  const index = siblings.findIndex((row) => row.id === id)
  const swap = index + direction
  if (index < 0 || swap < 0 || swap >= siblings.length) return []
  const next = [...siblings]
  ;[next[index], next[swap]] = [next[swap]!, next[index]!]
  return next.flatMap((row, position) => (row.position === position ? [] : [{ id: row.id, position }]))
}
