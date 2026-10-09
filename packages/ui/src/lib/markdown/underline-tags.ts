import type { Html, Nodes, PhrasingContent, Root } from "mdast"
import type { Underline } from "./mdast-nodes"

const OPEN_TAG = /^<u\s*>$/i
const CLOSE_TAG = /^<\/u\s*>$/i

/** Parents whose children are phrasing content: `<u>` pairs only between siblings of one of these. */
const PHRASING_PARENTS = new Set<Nodes["type"]>([
  "paragraph",
  "heading",
  "tableCell",
  "emphasis",
  "strong",
  "delete",
  "link",
  "linkReference",
  "spoiler",
  "underline",
])

/**
 * Replaces `<u>…</u>` pairs (raw HTML tags with nothing else in them) by `underline` nodes. Tags pair only inside
 * the same inline parent, like `**`; an unpaired or crossing tag stays raw HTML, which the renderer shows as text.
 */
export function pairUnderlineTags(tree: Root): void {
  visitParents(tree)
}

function visitParents(node: Nodes): void {
  if (!("children" in node)) return
  if (PHRASING_PARENTS.has(node.type)) {
    const parent = node as { children: PhrasingContent[] }
    parent.children = pairSiblings(parent.children)
  }
  for (const child of node.children) visitParents(child)
}

interface Frame {
  opener: Html
  items: PhrasingContent[]
}

function pairSiblings(children: PhrasingContent[]): PhrasingContent[] {
  const result: PhrasingContent[] = []
  const stack: Frame[] = []
  const target = () => stack.at(-1)?.items ?? result
  for (const child of children) {
    if (child.type === "html" && OPEN_TAG.test(child.value)) {
      stack.push({ opener: child, items: [] })
      continue
    }
    const frame = child.type === "html" && CLOSE_TAG.test(child.value) ? stack.pop() : undefined
    if (!frame) {
      target().push(child)
      continue
    }
    const underline: Underline = { type: "underline", children: frame.items, data: { hName: "u" } }
    const start = frame.opener.position?.start
    const end = child.position?.end
    if (start && end) underline.position = { start, end }
    target().push(underline)
  }
  // Unclosed `<u>` tags stay as they were, with whatever followed them.
  while (stack.length > 0) {
    const frame = stack.pop()
    if (frame) target().push(frame.opener, ...frame.items)
  }
  return result
}
