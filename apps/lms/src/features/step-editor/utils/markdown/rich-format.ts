import { indexMarkdown } from "./markdown-index"
import { applyChanges, touchedLines, type TextState } from "./text-state"

/** Colours and alignments the editor writes; the renderer reads the same tags (`@ihsp/ui` underline-tags). */
export type Align = "left" | "center" | "right"
export type Color = "red" | "orange" | "green" | "blue" | "purple" | "gray"

const COLOR_OPEN = /<span class="c-([a-z]+)">/g
const ALIGN_TAG = /<\/?align-(?:left|center|right)>/g
const LINE_PREFIX = /^(\s*(?:>\s?)*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)?)/

/** The colour span around the selection, if the selection sits inside one (same line). */
function colorSpanAt(state: TextState): {
  start: number
  open: number
  close: number
  end: number
  color: string
} | null {
  const { text, start, end } = state
  const lineStart = text.lastIndexOf("\n", start - 1) + 1
  const before = text.slice(lineStart, start)
  let found: { index: number; length: number; color: string } | null = null
  for (const match of before.matchAll(COLOR_OPEN)) {
    found = {
      index: lineStart + match.index,
      length: match[0].length,
      color: match[1] ?? "",
    }
  }
  if (!found) return null
  const contentStart = found.index + found.length
  if (text.slice(contentStart, start).includes("</span>")) return null
  const close = text.indexOf("</span>", end)
  const lineEnd = text.indexOf("\n", end)
  if (close === -1 || (lineEnd !== -1 && close > lineEnd)) return null
  if (text.slice(end, close).includes("<span")) return null
  return {
    start: found.index,
    open: contentStart,
    close,
    end: close + "</span>".length,
    color: found.color,
  }
}

/** The colour of the text at the selection, or null. */
export function colorAt(state: TextState): string | null {
  return colorSpanAt(state)?.color ?? null
}

/** Colours the selection (wraps it in a tag), recolours the span it is in, or removes the colour with `null`. */
export function setColor(state: TextState, color: Color | null): TextState {
  const span = colorSpanAt(state)
  if (span) {
    const inner = state.text.slice(span.open, span.close)
    const replacement = color ? `<span class="c-${color}">${inner}</span>` : inner
    const text = state.text.slice(0, span.start) + replacement + state.text.slice(span.end)
    const shift = color ? `<span class="c-${color}">`.length : 0
    const start = span.start + shift
    return { text, start, end: start + inner.length }
  }
  if (!color || state.start === state.end) return state
  return applyChanges(state, [
    { from: state.start, to: state.start, insert: `<span class="c-${color}">` },
    { from: state.end, to: state.end, insert: "</span>" },
  ])
}

function lineRanges(state: TextState): { from: number; to: number }[] {
  const { from, to } = touchedLines(state.text, state.start, state.end)
  const ranges: { from: number; to: number }[] = []
  let position = from
  const raw = indexMarkdown(state.text).rawBlocks
  for (const line of state.text.slice(from, to).split("\n")) {
    const trimmed = line.trim()
    const inRaw = raw.some((block) => block.start <= position && position < block.end)
    if (trimmed !== "" && !inRaw && !trimmed.startsWith("|"))
      ranges.push({ from: position, to: position + line.length })
    position += line.length + 1
  }
  return ranges
}

/** The alignment of the selected lines when they all share one (left when none is set), else null. */
export function alignmentAt(state: TextState): Align | null {
  const found = lineRanges(state).map(({ from, to }) => {
    const match = /<align-(left|center|right)>/.exec(state.text.slice(from, to))
    return (match?.[1] as Align | undefined) ?? "left"
  })
  const first = found[0]
  return first && found.every((value) => value === first) ? first : null
}

/** Aligns every selected text line: the tags go after any heading, list or quote mark; `left` removes them. */
export function setAlignment(state: TextState, align: Align): TextState {
  const ranges = lineRanges(state)
  if (ranges.length === 0) return state
  const first = ranges[0]
  const last = ranges[ranges.length - 1]
  if (!first || !last) return state
  let text = ""
  let cursor = first.from
  for (const { from, to } of ranges) {
    text += state.text.slice(cursor, from)
    const line = state.text.slice(from, to).replace(ALIGN_TAG, "")
    if (align === "left") text += line
    else {
      const prefix = LINE_PREFIX.exec(line)?.[0] ?? ""
      text += `${prefix}<align-${align}>${line.slice(prefix.length)}</align-${align}>`
    }
    cursor = to
  }
  const before = state.text.slice(0, first.from)
  const after = state.text.slice(last.to)
  const next = before + text + after
  const caret = Math.min(next.length, before.length + text.length)
  return { text: next, start: caret, end: caret }
}

/** A Markdown table on its own lines, header cells selected for typing. */
export function insertTable(state: TextState, rows = 2, columns = 2): TextState {
  const header = `| ${Array.from({ length: columns }, (_, i) => `H${i + 1}`).join(" | ")} |`
  const rule = `| ${Array.from({ length: columns }, () => "---").join(" | ")} |`
  const body = Array.from({ length: rows }, () => `| ${Array.from({ length: columns }, () => " ").join(" | ")} |`)
  return insertBlock(state, [header, rule, ...body].join("\n"), header.indexOf("H1"), 2)
}

/** An image from the files module: `![name](/files/<id>)`. */
export function insertImage(state: TextState, alt: string, url: string): TextState {
  const label = alt.replace(/[[\]\\]/g, "")
  const markdown = `![${label}](${url})`
  const text = state.text.slice(0, state.start) + markdown + state.text.slice(state.end)
  const caret = state.start + markdown.length
  return { text, start: caret, end: caret }
}

/** Inserts `block` on lines of its own and selects `length` characters at `offset` inside it. */
function insertBlock(state: TextState, block: string, offset: number, length: number): TextState {
  const { text, start, end } = state
  const lead = text.slice(0, start)
  const before = lead === "" || lead.endsWith("\n\n") ? "" : lead.endsWith("\n") ? "\n" : "\n\n"
  const lineEnd = text.indexOf("\n", end)
  const lineAfter = text.slice(end, lineEnd === -1 ? text.length : lineEnd)
  const after = lineAfter.trim() === "" ? "" : "\n\n"
  const next = text.slice(0, start) + before + block + after + text.slice(end)
  const from = start + before.length + offset
  return { text: next, start: from, end: from + length }
}
