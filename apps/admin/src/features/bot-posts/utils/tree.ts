import type { BotPost, BotPostTreeNode } from "@ihsp/api"

/** The tree as a flat list of posts (without `children`), in tree order. */
export function flattenTree(root: BotPostTreeNode): BotPost[] {
  const { children, ...post } = root
  return [post, ...children.flatMap(flattenTree)]
}

/** The node with `id`, or null. */
export function findNode(root: BotPostTreeNode, id: string): BotPostTreeNode | null {
  if (root.id === id) return root
  for (const child of root.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

/** The children of `parentId` in order, as ids. Used for reorder requests. */
export function siblingIds(root: BotPostTreeNode, parentId: string): string[] {
  const parent = findNode(root, parentId)
  return parent ? parent.children.map((child) => child.id) : []
}

/** The post with `id` and its descendants are not valid targets for a move. */
export function moveTargets(root: BotPostTreeNode, post: BotPostTreeNode): BotPost[] {
  if (post.is_root) return []
  const excluded = new Set(flattenTree(post).map((item) => item.id))
  return flattenTree(root).filter((candidate) => !excluded.has(candidate.id))
}

/** The root post cannot be deleted or moved. */
export function canDeleteBotPost(post: BotPost): boolean {
  return !post.is_root
}
