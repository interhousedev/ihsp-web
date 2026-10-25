import { indexMarkdown, type MarkdownIndex, type MathSpan } from "./markdown-index"
import { encloses } from "./link-format"
import { parseLine } from "./markdown-lines"
import type { TextState } from "./text-state"

/** A formula to write: its LaTeX and whether it is shown on its own line. */
export interface Formula {
  latex: string
  display: boolean
}

interface Target {
  start: number
  end: number
  block: boolean
}

/** The formula the selection is in (or that it selects), to edit it instead of inserting a new one. */
export function mathAt(state: TextState, index: MarkdownIndex = indexMarkdown(state.text)): MathSpan | null {
  return index.math.find((span) => encloses(span, state)) ?? null
}

/** What the equation dialog starts with: the formula at the selection, or the selected text as LaTeX. */
export function formulaAt(state: TextState, display: boolean): Formula & { editing: boolean } {
  const span = mathAt(state)
  if (span) return { latex: span.value, display: span.display, editing: true }
  const selected = state.text.slice(state.start, state.end).trim()
  // Plain prose (words with spaces and no TeX markup) is not a formula: start with an empty field.
  const prose = /\s/.test(selected) && !/[\\^_{]/.test(selected)
  return {
    latex: prose ? "" : selected,
    display,
    editing: false,
  }
}

/**
 * Writes a formula over the selection, or over the formula being edited. Inline formulas become `$…$` (a space is
 * added where a digit, a dollar or an escaping backslash next to it would stop it from being read as math). Display
 * formulas become a `$$` block on their own lines, split out of the line they land in and indented into its quote or
 * list item; a display formula edited inside a sentence stays there as `$$…$$`. The caret ends up after the formula.
 * Returns `null` if the result would not read back as this formula (for example, it holds an unescaped `$`).
 */
export function insertFormula(state: TextState, formula: Formula): TextState | null {
  const latex = formula.latex.trim()
  if (latex === "") return null
  const index = indexMarkdown(state.text)
  const span = mathAt(state, index)
  const target: Target = span ?? {
    start: state.start,
    end: state.end,
    block: false,
  }
  const inSentence = span !== null && !span.block
  const result =
    formula.display && !inSentence
      ? writeBlock(state.text, target, latex)
      : writeInline(state.text, target, latex, formula.display)
  return readsBack(result, latex) ? result : null
}

function writeInline(text: string, target: Target, latex: string, display: boolean): TextState {
  const flat = latex.replace(/\s*\n\s*/g, " ")
  const fence = display ? "$$" : "$"
  const spaceBefore = /[\d$]/.test(text[target.start - 1] ?? "") || escapes(text, target.start - 1) ? " " : ""
  const spaceAfter = /[\d$]/.test(text[target.end] ?? "") ? " " : ""
  const written = `${spaceBefore}${fence}${flat}${fence}`
  const caret = target.start + written.length
  return {
    text: text.slice(0, target.start) + written + spaceAfter + text.slice(target.end),
    start: caret,
    end: caret,
  }
}

function escapes(text: string, offset: number): boolean {
  let backslashes = 0
  while (text[offset - backslashes] === "\\") backslashes++
  return backslashes % 2 === 1
}

/**
 * A `$$` block on lines of its own. Text before the target stays on its line and text after it moves below the
 * block; the block lines get the quote markers and list indentation of the line, so they stay in that quote or item.
 */
function writeBlock(text: string, target: Target, latex: string): TextState {
  const lineStart = text.lastIndexOf("\n", target.start - 1) + 1
  const lineEndAt = text.indexOf("\n", target.end)
  const lineEnd = lineEndAt === -1 ? text.length : lineEndAt
  const firstLineEnd = text.indexOf("\n", lineStart)
  const line = parseLine(text.slice(lineStart, firstLineEnd === -1 ? text.length : firstLineEnd), lineStart)
  const markers = Math.min(target.start - lineStart, line.quote.length + line.indent.length + line.marker.length)
  const prefix = line.quote + " ".repeat(Math.max(0, markers - line.quote.length))
  const head = text.slice(lineStart, target.start)
  const tail = text.slice(target.end, lineEnd)
  const keepHead = line.heading !== "" || head.slice(markers).trim() !== ""
  const lines = keepHead ? [head.trimEnd(), `${prefix}$$`] : [`${head.slice(0, markers)}$$`]
  lines.push(...latex.split("\n").map((part) => `${prefix}${part}`), `${prefix}$$`)
  const caret = lineStart + lines.join("\n").length
  if (tail.trim() !== "") lines.push(prefix + tail.trimStart())
  const written = lines.join("\n")
  return {
    text: text.slice(0, lineStart) + written + text.slice(lineEnd),
    start: caret,
    end: caret,
  }
}

/** The formula that ends at the caret must be exactly the one written. */
function readsBack(state: TextState, latex: string): boolean {
  const flat = latex.replace(/\s*\n\s*/g, " ")
  const lines = latex
    .split("\n")
    .map((part) => part.trim())
    .join("\n")
  return indexMarkdown(state.text).math.some(
    (span) =>
      span.end === state.start &&
      (span.value === flat ||
        span.value
          .split("\n")
          .map((part) => part.trim())
          .join("\n") === lines),
  )
}
