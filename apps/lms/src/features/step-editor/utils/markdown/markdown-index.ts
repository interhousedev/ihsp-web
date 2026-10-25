import { isDisplayInlineMath, parseMarkdown } from "@ihsp/ui"
import type { Nodes, PhrasingContent, Root } from "mdast"

/** The inline formats of the editor toolbar, each with the Markdown it writes. */
export type InlineFormat = "bold" | "italic" | "underline" | "strike" | "code" | "spoiler"

export const INLINE_FORMATS: readonly InlineFormat[] = ["bold", "italic", "underline", "strike", "code", "spoiler"]

const NODE_FORMATS: Partial<Record<Nodes["type"], InlineFormat>> = {
  strong: "bold",
  emphasis: "italic",
  underline: "underline",
  delete: "strike",
  inlineCode: "code",
  spoiler: "spoiler",
}

/** A span of the source: `[start, end)` is the whole node, `[contentStart, contentEnd)` what is between its markers. */
export interface Span {
  start: number
  end: number
  contentStart: number
  contentEnd: number
}

export interface FormatSpan extends Span {
  format: InlineFormat
}

/** A paragraph, heading or table cell: inline formats never cross its bounds. */
export interface Container extends Span {
  type: "paragraph" | "heading" | "tableCell"
  children: PhrasingContent[]
}

export interface MathSpan {
  start: number
  end: number
  value: string
  display: boolean
  /** A `$$` block on its own lines (not `$…$` / `$$…$$` inside a paragraph). */
  block: boolean
}

/** Text the reader sees: text, inline code and formula leaves, with their source range. */
export interface Leaf {
  start: number
  end: number
  value: string
  /** Inline code, a formula or raw HTML: markers can't go inside it. */
  atomic: boolean
}

export interface LinkSpan extends Span {
  url: string
  /** Written as `[text](url)`, so the link can be edited or removed (autolinks can't). */
  inline: boolean
}

export interface RawBlock {
  kind: "code" | "math" | "html"
  start: number
  end: number
  /** A fenced code block (```` ``` ```` or `~~~`), which can be unwrapped. */
  fenced: boolean
}

/** Positions of everything the editor transforms care about, read from the same parser the renderer uses. */
export interface MarkdownIndex {
  text: string
  tree: Root
  containers: Container[]
  formats: FormatSpan[]
  links: LinkSpan[]
  math: MathSpan[]
  leaves: Leaf[]
  /** Fenced or indented code, `$$` math and raw HTML blocks: their lines are left alone by line formats. */
  rawBlocks: RawBlock[]
}

export function indexMarkdown(text: string): MarkdownIndex {
  const tree = parseMarkdown(text)
  const index: MarkdownIndex = {
    text,
    tree,
    containers: [],
    formats: [],
    links: [],
    math: [],
    leaves: [],
    rawBlocks: [],
  }
  visit(tree, index)
  return index
}

export function startOf(node: Nodes): number {
  return node.position?.start.offset ?? 0
}

export function endOf(node: Nodes): number {
  return node.position?.end.offset ?? 0
}

function visit(node: Nodes, index: MarkdownIndex): void {
  record(node, index)
  if ("children" in node) for (const child of node.children) visit(child, index)
}

function record(node: Nodes, index: MarkdownIndex): void {
  const format = NODE_FORMATS[node.type]
  if (format) index.formats.push({ format, ...spanOf(node, index.text) })
  switch (node.type) {
    case "text":
      index.leaves.push({
        start: startOf(node),
        end: endOf(node),
        value: node.value,
        atomic: false,
      })
      break
    case "inlineCode": {
      const span = codeSpan(index.text, startOf(node), endOf(node))
      index.leaves.push({
        start: span.contentStart,
        end: span.contentEnd,
        value: node.value,
        atomic: true,
      })
      break
    }
    case "paragraph":
    case "heading":
    case "tableCell":
      index.containers.push({
        type: node.type,
        children: node.children,
        ...spanOf(node, index.text),
      })
      break
    case "link":
      index.links.push({
        url: node.url,
        inline: index.text[startOf(node)] === "[",
        ...spanOf(node, index.text),
      })
      break
    case "inlineMath":
      index.math.push(mathSpan(node, isDisplayInlineMath(node, index.text), false))
      index.leaves.push({
        start: startOf(node),
        end: endOf(node),
        value: node.value,
        atomic: true,
      })
      break
    case "math":
      index.math.push(mathSpan(node, true, true))
      index.rawBlocks.push({
        kind: "math",
        start: startOf(node),
        end: endOf(node),
        fenced: true,
      })
      break
    case "code":
      index.rawBlocks.push({
        kind: "code",
        start: startOf(node),
        end: endOf(node),
        fenced: /^ {0,3}(`{3,}|~{3,})/.test(sourceOf(node, index.text)),
      })
      break
    case "html":
      // Inline HTML other than paired `<u>` tags is shown as text; an HTML block is left alone like code.
      if (isInline(node, index.text)) {
        index.leaves.push({
          start: startOf(node),
          end: endOf(node),
          value: node.value,
          atomic: true,
        })
      } else
        index.rawBlocks.push({
          kind: "html",
          start: startOf(node),
          end: endOf(node),
          fenced: false,
        })
      break
    default:
      break
  }
}

function sourceOf(node: Nodes, text: string): string {
  return text.slice(startOf(node), endOf(node))
}

function mathSpan(node: Nodes & { value: string }, display: boolean, block: boolean): MathSpan {
  return {
    start: startOf(node),
    end: endOf(node),
    value: node.value,
    display,
    block,
  }
}

/** Inline HTML sits inside a paragraph; an HTML block starts its own line. */
function isInline(node: Nodes, text: string): boolean {
  const start = startOf(node)
  const lineStart = text.lastIndexOf("\n", start - 1) + 1
  return text.slice(lineStart, start).trim() !== ""
}

/** The node and its content bounds. Children start and end right next to the markers in every format we write. */
function spanOf(node: Nodes, text: string): Span {
  const start = startOf(node)
  const end = endOf(node)
  if (node.type === "inlineCode") return codeSpan(text, start, end)
  const children = "children" in node ? node.children : []
  const first = children[0]
  const last = children.at(-1)
  if (first && last)
    return {
      start,
      end,
      contentStart: startOf(first),
      contentEnd: endOf(last),
    }
  if (node.type === "underline") {
    // `<u></u>`: the content is the empty gap between the tags.
    const gap = text.indexOf(">", start) + 1
    return { start, end, contentStart: gap, contentEnd: gap }
  }
  return { start, end, contentStart: start, contentEnd: end }
}

/** `` `x` `` or ``` `` x `` ```: the content is inside the backticks and the one space of padding on each side. */
function codeSpan(text: string, start: number, end: number): Span {
  let fence = 0
  while (text[start + fence] === "`") fence++
  let contentStart = start + fence
  let contentEnd = end - fence
  const inner = text.slice(contentStart, contentEnd)
  if (inner.length > 1 && /^[ \n]/.test(inner) && /[ \n]$/.test(inner) && inner.trim() !== "") {
    contentStart += 1
    contentEnd -= 1
  }
  return { start, end, contentStart, contentEnd }
}
