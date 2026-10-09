import type { Html, Nodes, PhrasingContent, Root } from "mdast"
import type { Underline } from "./mdast-nodes"

/** Text colours of `<span class="c-red">…</span>` (the editor's palette). */
export const TEXT_COLORS = ["red", "orange", "green", "blue", "purple", "gray"] as const
export type TextColor = (typeof TEXT_COLORS)[number]
export const ALIGNMENTS = ["left", "center", "right"] as const
export type Alignment = (typeof ALIGNMENTS)[number]

const OPEN_TAG = /^<u\s*>$/i
const CLOSE_TAG = /^<\/u\s*>$/i
const COLOR_OPEN = new RegExp(`^<span class="c-(${TEXT_COLORS.join("|")})">$`)
const ALIGN_OPEN = new RegExp(`^<align-(${ALIGNMENTS.join("|")})>$`)

/** What an opening tag starts: `u`, `c-red`, `align-center`; `null` for any other HTML. */
function openKind(value: string): string | null {
  if (OPEN_TAG.test(value)) return "u"
  const color = COLOR_OPEN.exec(value)?.[1]
  if (color) return `c-${color}`
  const align = ALIGN_OPEN.exec(value)?.[1]
  return align ? `align-${align}` : null
}

function closesKind(value: string, kind: string): boolean {
  if (kind === "u") return CLOSE_TAG.test(value)
  if (kind.startsWith("c-")) return value === "</span>"
  return value === `</${kind}>`
}

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
  kind: string
  opener: Html
  items: PhrasingContent[]
}

function pairSiblings(children: PhrasingContent[]): PhrasingContent[] {
  const result: PhrasingContent[] = []
  const stack: Frame[] = []
  const target = () => stack.at(-1)?.items ?? result
  for (const child of children) {
    const kind = child.type === "html" ? openKind(child.value) : null
    if (child.type === "html" && kind) {
      stack.push({ kind, opener: child, items: [] })
      continue
    }
    const top = stack.at(-1)
    const frame = child.type === "html" && top && closesKind(child.value, top.kind) ? stack.pop() : undefined
    if (!frame) {
      target().push(child)
      continue
    }
    const underline: Underline = { type: "underline", children: frame.items, data: dataFor(frame.kind) }
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

function dataFor(kind: string): Underline["data"] {
  if (kind === "u") return { hName: "u" }
  if (kind.startsWith("c-")) return { hName: "span", hProperties: { dataColor: kind.slice(2) } }
  return { hName: "span", hProperties: { dataAlignWrap: kind.slice(6) } }
}

/** A paragraph or heading that is one `<align-…>` pair becomes an aligned block (the wrapper disappears). */
export function applyAlignment(tree: Root): void {
  const walk = (node: Nodes): void => {
    if (!("children" in node)) return
    if ((node.type === "paragraph" || node.type === "heading") && node.children.length === 1) {
      const only = node.children[0] as Underline | undefined
      const align = only?.type === "underline" ? only.data?.hProperties?.dataAlignWrap : undefined
      if (only && typeof align === "string") {
        node.children = only.children
        node.data = { ...node.data, hProperties: { dataAlign: align } }
        return
      }
    }
    for (const child of node.children) walk(child)
  }
  walk(tree)
}
