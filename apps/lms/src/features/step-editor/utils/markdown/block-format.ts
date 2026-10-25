import { indexMarkdown, type MarkdownIndex } from "./markdown-index"
import {
  headingLevel,
  isBlank,
  isBullet,
  isOrdered,
  type Line,
  linesBetween,
  parseLine,
  separatorBetween,
  wouldJoin,
} from "./markdown-lines"
import { type TextState, touchedLines } from "./text-state"

/** The line formats of the editor: headings, lists and quotes. */
export type BlockFormat = "heading1" | "heading2" | "heading3" | "bulletList" | "orderedList" | "quote"

export const BLOCK_FORMATS: readonly BlockFormat[] = [
  "heading1",
  "heading2",
  "heading3",
  "bulletList",
  "orderedList",
  "quote",
]

interface Target {
  line: Line
  /** Code, `$$` math or HTML block lines: headings and lists leave them alone. */
  raw: boolean
  /** Indented text under a list item: it belongs to that item. */
  continuation: boolean
}

/** A line edit: the first `cut` characters of the line are replaced by `prefix`; the rest stays as it is. */
interface PrefixEdit {
  cut: number
  prefix: string
}

/** The lines of the selection, widened so a code or math block is never cut in half. */
function targets(state: TextState, index: MarkdownIndex): Target[] {
  let { from, to } = touchedLines(state.text, state.start, state.end)
  for (const block of index.rawBlocks) {
    if (block.start < to && from < block.end) {
      from = Math.min(from, block.start)
      to = Math.max(to, block.end)
    }
  }
  const above = lineAbove(state.text, from)
  let inList = above !== null && (above.marker !== "" || above.indent.length >= 2)
  return linesBetween(state.text, from, to).map((line) => {
    const raw = index.rawBlocks.some((block) => block.start <= line.start && line.start < block.end)
    const continuation = inList && line.marker === "" && line.indent.length >= 2 && !isBlank(line)
    if (line.marker !== "") inList = true
    else if (!isBlank(line) && line.indent.length < 2) inList = false
    return { line, raw, continuation }
  })
}

function lineAbove(text: string, lineStart: number): Line | null {
  if (lineStart === 0) return null
  const start = text.lastIndexOf("\n", lineStart - 2) + 1
  return parseLine(text.slice(start, lineStart - 1), start)
}

function lineBelow(text: string, lineEnd: number): Line | null {
  if (lineEnd >= text.length) return null
  const start = lineEnd + 1
  const end = text.indexOf("\n", start)
  return parseLine(text.slice(start, end === -1 ? undefined : end), start)
}

/** Lines a heading or list format applies to: not blank, not code, not the continuation text of a list item. */
function formattable(all: Target[]): Target[] {
  return all.filter((target) => !target.raw && !target.continuation && !isBlank(target.line))
}

function holds(format: BlockFormat, lines: Line[]): boolean {
  if (lines.length === 0) return false
  switch (format) {
    case "heading1":
    case "heading2":
    case "heading3":
      return lines.every((line) => headingLevel(line) === Number(format.slice(-1)))
    case "bulletList":
      return lines.every(isBullet)
    case "orderedList":
      return lines.every(isOrdered)
    case "quote":
      return lines.every((line) => line.quote !== "")
  }
}

function linesFor(format: BlockFormat, all: Target[]): Line[] {
  const chosen = format === "quote" ? all.filter((target) => !isBlank(target.line)) : formattable(all)
  return chosen.map((target) => target.line)
}

/** The line formats that hold for every selected line: the pressed toolbar buttons. */
export function activeBlockFormats(state: TextState, index = indexMarkdown(state.text)): Set<BlockFormat> {
  const all = targets(state, index)
  return new Set(BLOCK_FORMATS.filter((format) => holds(format, linesFor(format, all))))
}

/**
 * Turns a heading level, a list or a quote on for every selected line, or off when all of them have it already.
 * Blank lines are added where Markdown would otherwise merge a changed line into its neighbour's paragraph, quote or
 * list item, so each line keeps the block the author chose. The selection keeps covering the same text.
 */
export function toggleBlock(state: TextState, format: BlockFormat): TextState {
  const index = indexMarkdown(state.text)
  const all = targets(state, index)
  const off = holds(format, linesFor(format, all))
  const edits = format === "quote" ? quoteEdits(all, off) : lineEdits(all, format, off, state.text)
  if (edits.size === 0) return state
  return rebuild(state, index, all, edits, format, off)
}

function lineEdits(all: Target[], format: BlockFormat, off: boolean, text: string): Map<number, PrefixEdit> {
  const edits = new Map<number, PrefixEdit>()
  let number = format === "orderedList" ? firstNumber(all, text) : 1
  all.forEach((target, position) => {
    if (target.raw || target.continuation || isBlank(target.line)) return
    const { quote, indent, marker, heading } = target.line
    if (format === "bulletList" || format === "orderedList") {
      const next = off ? "" : format === "bulletList" ? "- " : `${number++}. `
      edits.set(position, {
        cut: (quote + indent + marker).length,
        prefix: quote + indent + next,
      })
    } else {
      const next = off ? "" : `${"#".repeat(Number(format.slice(-1)))} `
      edits.set(position, {
        cut: (quote + indent + marker + heading).length,
        prefix: quote + indent + marker + next,
      })
    }
  })
  return edits
}

/** An ordered list continues the numbering of an item right above the selection. */
function firstNumber(all: Target[], text: string): number {
  const first = all[0]?.line
  const above = first ? lineAbove(text, first.start) : null
  const value = above ? /^\d+/.exec(above.marker)?.[0] : undefined
  return value && above?.quote === first?.quote && above?.indent === first?.indent ? Number(value) + 1 : 1
}

function quoteEdits(all: Target[], off: boolean): Map<number, PrefixEdit> {
  const edits = new Map<number, PrefixEdit>()
  all.forEach((target, position) => {
    const { line } = target
    if (off) {
      const marker = /^ {0,3}>[ \t]?/.exec(line.text)?.[0]
      if (marker) edits.set(position, { cut: marker.length, prefix: "" })
    } else if (line.quote === "") {
      edits.set(position, { cut: 0, prefix: isBlank(line) ? ">" : "> " })
    }
  })
  return edits
}

function unchangedRow(line: Line | null): Row | null {
  return line ? { before: line, after: line, edit: null, continuation: false } : null
}

interface Row {
  before: Line
  after: Line
  edit: PrefixEdit | null
  continuation: boolean
}

/**
 * Writes the edited lines back, adds blank lines where an edited line would merge into a neighbour it should stay
 * apart from, and maps the selection onto the same text.
 */
function rebuild(
  state: TextState,
  index: MarkdownIndex,
  all: Target[],
  edits: Map<number, PrefixEdit>,
  format: BlockFormat,
  off: boolean,
): TextState {
  const rows: Row[] = all.map((target, position) => {
    const edit = edits.get(position) ?? null
    const text = edit ? edit.prefix + target.line.text.slice(edit.cut) : target.line.text
    return {
      before: target.line,
      after: parseLine(text, 0),
      edit,
      continuation: target.continuation,
    }
  })
  const first = rows[0]
  const last = rows.at(-1)
  if (!first || !last) return state
  const from = first.before.start
  const to = last.before.start + last.before.text.length
  const above = lineAbove(state.text, from)
  const below = lineBelow(state.text, to)

  const output: string[] = []
  const starts: number[] = []
  let offset = from
  const push = (line: string) => {
    output.push(line)
    offset += line.length + 1
  }
  let previous = unchangedRow(above)
  for (const row of rows) {
    if (previous && needsSeparator(previous, row, index, format, off)) {
      push(separatorBetween(previous.after, row.after))
    }
    starts.push(offset)
    push(row.after.text)
    previous = row
  }
  const next = unchangedRow(below)
  if (previous && next && needsSeparator(previous, next, index, format, off)) {
    push(separatorBetween(previous.after, next.after))
  }

  const replaced = output.join("\n")
  const text = state.text.slice(0, from) + replaced + state.text.slice(to)
  const growth = replaced.length - (to - from)
  const map = (position: number) => {
    if (position < from) return position
    if (position > to) return position + growth
    const at = rows.findIndex((row) => position <= row.before.start + row.before.text.length)
    const row = rows[at]
    const start = starts[at]
    if (!row || start === undefined) return position + growth
    const inLine = position - row.before.start
    if (!row.edit) return start + inLine
    return start + row.edit.prefix.length + Math.max(0, inLine - row.edit.cut)
  }
  const start = map(state.start)
  return { text, start, end: Math.max(start, map(state.end)) }
}

/**
 * Whether a blank line must go between `upper` and `lower`: they would join into one paragraph (or a lazy quote or
 * list continuation) but should stay apart. That is when only one of them changed (a quote or list added to a line
 * must not pull in the next one), except that a line which lazily continued a list item or quote stays with it when
 * the list or quote is removed; and when both changed and were separate blocks before (two items, two headings).
 * Text under a list item always stays with its item.
 */
function needsSeparator(upper: Row, lower: Row, index: MarkdownIndex, format: BlockFormat, off: boolean): boolean {
  if ((!upper.edit && !lower.edit) || lower.continuation) return false
  if (!wouldJoin(upper.after, lower.after)) return false
  if (Boolean(upper.edit) !== Boolean(lower.edit)) {
    return !(off && upper.edit && sameParagraph(index, upper.before, lower.before))
  }
  if (format === "quote") return false
  return !sameParagraph(index, upper.before, lower.before)
}

function sameParagraph(index: MarkdownIndex, upper: Line, lower: Line): boolean {
  const paragraph = index.containers.find(
    (container) => container.start <= upper.start + upper.text.length && upper.start <= container.end,
  )
  return paragraph !== undefined && paragraph.start <= lower.start && lower.start <= paragraph.end
}
