import type { ManageTopic } from "@ihsp/api"

export type TopicNode = ManageTopic & { children: TopicNode[] }

/**
 * The flat topics of one subject as a tree, children in `position` order. A topic whose parent is missing from the
 * list (it was filtered out or deleted) is shown as a root rather than lost.
 */
export function buildTopicTree(flat: readonly ManageTopic[]): TopicNode[] {
  const nodes = new Map<string, TopicNode>(flat.map((topic) => [topic.id, { ...topic, children: [] }]))
  const roots: TopicNode[] = []
  for (const topic of flat.toSorted((a, b) => a.position - b.position)) {
    const node = nodes.get(topic.id)
    if (!node) continue
    const parent = topic.parent_id ? nodes.get(topic.parent_id) : undefined
    if (parent && parent.id !== node.id) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

/** How many topics a delete removes besides the topic itself (the API deletes the whole subtree). */
export function descendantCount(node: TopicNode): number {
  return node.children.reduce((sum, child) => sum + 1 + descendantCount(child), 0)
}
