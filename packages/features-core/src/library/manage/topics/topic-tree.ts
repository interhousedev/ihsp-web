import type { ManageTopic } from "@ihsp/api"
import { buildTree, descendantCount as countDescendants, type TreeNode } from "../shared/tree"

export type TopicNode = TreeNode<ManageTopic>

/** The flat topics of one subject as a tree, children in `position` order (see `buildTree`). */
export function buildTopicTree(flat: readonly ManageTopic[]): TopicNode[] {
  return buildTree(flat)
}

/** How many topics a delete removes besides the topic itself (the API deletes the whole subtree). */
export function descendantCount(node: TopicNode): number {
  return countDescendants(node)
}
