import type { PhrasingContent } from "mdast"
import {
  type Container,
  endOf,
  type FormatSpan,
  type InlineFormat,
  INLINE_FORMATS,
  indexMarkdown,
  type MarkdownIndex,
  startOf,
} from "./markdown-index"
import { applyChanges, type Change, mapPosition, type TextState } from "./text-state"

const MARKERS: Record<Exclude<InlineFormat, "code">, readonly [string, string]> = {
  bold: ["**", "**"],
  italic: ["*", "*"],
  underline: ["<u>", "</u>"],
  strike: ["~~", "~~"],
  spoiler: ["||", "||"],
}

type Marked = InlineFormat | "link"

const BITS: Record<Marked, number> = {
  bold: 1,
  italic: 2,
  underline: 4,
  strike: 8,
  code: 16,
  spoiler: 32,
  link: 64,
}
const MARKED: readonly Marked[] = [...INLINE_FORMATS, "link"]

interface Range {
  from: number
  to: number
}

/** The markers of `format` around `content`: code uses a fence longer than any backtick run inside. */
export function markersFor(format: InlineFormat, content: string): readonly [string, string] {
  if (format !== "code") return MARKERS[format]
  const longest = Math.max(0, ...(content.match(/`+/g) ?? []).map((run) => run.length))
  const fence = "`".repeat(longest + 1)
  const pad = content.startsWith("`") || content.endsWith("`") ? " " : ""
  return [fence + pad, pad + fence]
}

/** Pipes split a table row into cells, so spoilers can't go into table cells. */
function allows(container: Container, format: InlineFormat): boolean {
  return !(format === "spoiler" && container.type === "tableCell")
}

// - - - Reading the formats at the selection - - -

/** For each source offset, the formats whose content covers it (bit mask). */
function formatMask(index: MarkdownIndex): Uint8Array {
  const mask = new Uint8Array(index.text.length + 1)
  const mark = (from: number, to: number, bit: number) => {
    for (let offset = from; offset < to; offset++) mask[offset] = (mask[offset] ?? 0) | bit
  }
  for (const span of index.formats) mark(span.contentStart, span.contentEnd, BITS[span.format])
  for (const link of index.links) mark(link.contentStart, link.contentEnd, BITS.link)
  return mask
}

/** Source offsets of the visible, non-space characters in `[from, to)`. */
function visibleOffsets(index: MarkdownIndex, from: number, to: number): number[] {
  const offsets: number[] = []
  for (const leaf of index.leaves) {
    const end = Math.min(to, leaf.end)
    for (let offset = Math.max(from, leaf.start); offset < end; offset++) {
      if (!/\s/.test(index.text[offset] ?? " ")) offsets.push(offset)
    }
  }
  return offsets
}

/** Visible characters in `[from, to)` that `format` can apply to (not spoilers in table cells). */
function formattableOffsets(index: MarkdownIndex, format: InlineFormat, from: number, to: number): number[] {
  const excluded = index.containers.filter((container) => !allows(container, format))
  return visibleOffsets(index, from, to).filter(
    (offset) => !excluded.some((container) => container.contentStart <= offset && offset < container.contentEnd),
  )
}

function covers(span: FormatSpan, offset: number): boolean {
  return span.contentStart <= offset && offset <= span.contentEnd
}

function activeIn(index: MarkdownIndex, mask: Uint8Array, format: InlineFormat, start: number, end: number): boolean {
  const offsets = start === end ? [] : formattableOffsets(index, format, start, end)
  if (offsets.length === 0) return index.formats.some((span) => span.format === format && covers(span, start))
  const bit = BITS[format]
  return offsets.every((offset) => ((mask[offset] ?? 0) & bit) !== 0)
}

/** The formats that cover every visible character of the selection (or the caret): the pressed toolbar buttons. */
export function activeInlineFormats(state: TextState, index = indexMarkdown(state.text)): Set<InlineFormat> {
  const mask = formatMask(index)
  return new Set(INLINE_FORMATS.filter((format) => activeIn(index, mask, format, state.start, state.end)))
}

// - - - Toggling - - -

/**
 * Turns `format` on for the selection, or off when every selected character already has it (like Telegram and word
 * processors). Works across lines and blocks, inside and around other formats, merges with touching spans of the
 * same format (no doubled markers) and splits a span when only part of it is turned off. With a caret it toggles the
 * span around the caret, else the word under it, else inserts an empty pair to type into.
 *
 * The result is parsed again and must keep the visible text and every other format: if CommonMark would read the
 * markers differently, a wider selection is tried (whole inline spans, then whole words), and if nothing works the
 * text stays as it was.
 */
export function toggleInline(state: TextState, format: InlineFormat): TextState {
  const index = indexMarkdown(state.text)
  if (state.start === state.end) return toggleAtCaret(state, format, index)
  const on = !activeIn(index, formatMask(index), format, state.start, state.end)
  for (const { range, widen } of attempts(index, state)) {
    const selection = { ...state, start: range.from, end: range.to }
    const result = on ? addFormat(selection, format, index, widen) : removeFormat(selection, format, index)
    if (result && keepsEverythingElse(index, selection, result, format, on)) return result
  }
  return state
}

/** The selection itself, then widened over formulas, code and links it cuts, then over whole words. */
function attempts(index: MarkdownIndex, state: TextState): { range: Range; widen: boolean }[] {
  const exact = { from: state.start, to: state.end }
  const atoms = widenOverAtoms(index, exact)
  const words = widenOverAtoms(index, widenToWords(index.text, atoms))
  return [
    { range: exact, widen: false },
    { range: atoms, widen: true },
    { range: words, widen: true },
  ]
}

function toggleAtCaret(state: TextState, format: InlineFormat, index: MarkdownIndex): TextState {
  const caret = state.start
  if (index.rawBlocks.some((block) => block.start < caret && caret < block.end)) return state
  const around = index.formats.filter((span) => span.format === format && covers(span, caret))
  if (around.length > 0) {
    const whole = {
      ...state,
      start: Math.min(...around.map((span) => span.start)),
      end: Math.max(...around.map((span) => span.end)),
    }
    const result = applyChanges(state, unwrapChanges(around))
    return keepsEverythingElse(index, whole, result, format, false) ? result : state
  }
  const [open, close] = markersFor(format, "")
  if (state.text.slice(caret - open.length, caret) === open && state.text.startsWith(close, caret)) {
    return applyChanges(state, [{ from: caret - open.length, to: caret + close.length, insert: "" }])
  }
  const word = wordAround(index, caret)
  if (word) {
    const result = toggleInline({ ...state, start: word.from, end: word.to }, format)
    if (result.text === state.text) return state
    const inside = Math.min(result.start + (caret - word.from), result.end)
    return { text: result.text, start: inside, end: inside }
  }
  const text = state.text.slice(0, caret) + open + close + state.text.slice(caret)
  return { text, start: caret + open.length, end: caret + open.length }
}

function isWord(char: string | undefined): boolean {
  return char !== undefined && /[\p{L}\p{N}\p{M}]/u.test(char)
}

/** The word (letters and digits) the caret touches, if the caret is in visible text. */
function wordAround(index: MarkdownIndex, caret: number): Range | null {
  const leaf = index.leaves.find((candidate) => !candidate.atomic && candidate.start <= caret && caret <= candidate.end)
  if (!leaf) return null
  let from = caret
  let to = caret
  while (from > leaf.start && isWord(index.text[from - 1])) from--
  while (to < leaf.end && isWord(index.text[to])) to++
  return from < to ? { from, to } : null
}

function unwrapChanges(spans: FormatSpan[]): Change[] {
  return spans.flatMap((span) => [
    { from: span.start, to: span.contentStart, insert: "" },
    { from: span.contentEnd, to: span.end, insert: "" },
  ])
}

function sortChanges(changes: Change[]): Change[] {
  return changes.toSorted((a, b) => a.from - b.from || a.to - b.to)
}

/** Unwraps the spans of `format` that the selection overlaps or touches, then wraps their union with the selection. */
function addFormat(state: TextState, format: InlineFormat, index: MarkdownIndex, widen: boolean): TextState | null {
  const spans = index.formats.filter(
    (span) => span.format === format && span.start <= state.end && state.start <= span.end,
  )
  const changes = sortChanges(unwrapChanges(spans))
  const unwrapped = applyChanges(state, changes)
  const from = Math.min(unwrapped.start, ...spans.map((span) => mapPosition(span.start, changes, "before")))
  const to = Math.max(unwrapped.end, ...spans.map((span) => mapPosition(span.end, changes, "before")))
  return wrapRanges(unwrapped, format, [{ from, to }], widen)
}

/** Unwraps the spans of `format` the selection overlaps, then wraps again what of them lies outside the selection. */
function removeFormat(state: TextState, format: InlineFormat, index: MarkdownIndex): TextState | null {
  const spans = index.formats.filter(
    (span) => span.format === format && span.start < state.end && state.start < span.end,
  )
  if (spans.length === 0) return null
  const changes = sortChanges(unwrapChanges(spans))
  const unwrapped = applyChanges(state, changes)
  const outerStart = mapPosition(Math.min(...spans.map((span) => span.start)), changes, "before")
  const outerEnd = mapPosition(Math.max(...spans.map((span) => span.end)), changes, "before")
  const rest = [
    { from: outerStart, to: unwrapped.start },
    { from: unwrapped.end, to: outerEnd },
  ].filter((range) => /\S/.test(unwrapped.text.slice(range.from, range.to)))
  // The rest may hold only markers of other formats: then there is nothing left to wrap.
  return (rest.length > 0 ? wrapRanges(unwrapped, format, rest, false) : null) ?? unwrapped
}

/** Wraps each range with the markers of `format`, split where a range would cross a block or another span. */
function wrapRanges(state: TextState, format: InlineFormat, ranges: Range[], widen: boolean): TextState | null {
  const index = indexMarkdown(state.text)
  const segments = ranges.flatMap((range) => segmentsIn(index, format, range, widen))
  if (segments.length === 0) return null
  const changes = segments.flatMap((segment): Change[] => {
    const [open, close] = markersFor(format, state.text.slice(segment.from, segment.to))
    return [
      { from: segment.from, to: segment.from, insert: open },
      { from: segment.to, to: segment.to, insert: close },
    ]
  })
  return applyChanges(state, changes)
}

/**
 * The pieces of `range` that can be wrapped as they are: inside one paragraph, heading or table cell, and either
 * around whole inline spans or inside one. With `widen`, a span cut by the range is taken whole instead of split.
 */
function segmentsIn(index: MarkdownIndex, format: InlineFormat, range: Range, widen: boolean): Range[] {
  const segments: Range[] = []
  for (const container of index.containers) {
    if (!allows(container, format)) continue
    const from = Math.max(range.from, container.contentStart)
    const to = Math.min(range.to, container.contentEnd)
    if (from < to) collectSegments(container.children, { from, to }, widen, segments)
  }
  return segments.flatMap((segment) => {
    const trimmed = trimSegment(index.text, segment)
    return trimmed ? [trimmed] : []
  })
}

function collectSegments(children: PhrasingContent[], range: Range, widen: boolean, out: Range[]): void {
  let current: Range | null = null
  const extend = (from: number, to: number) => {
    current = current ? { from: current.from, to } : { from, to }
  }
  for (const child of children) {
    const start = startOf(child)
    const end = endOf(child)
    if (end <= range.from || start >= range.to) continue
    if (child.type === "text") {
      extend(Math.max(range.from, start), Math.min(range.to, end))
      continue
    }
    const inner = "children" in child ? child.children : []
    const first = inner[0]
    const last = inner.at(-1)
    if (!first || !last || widen || (range.from <= start && end <= range.to)) {
      extend(start, end)
      continue
    }
    if (current) out.push(current)
    current = null
    collectSegments(
      inner,
      {
        from: Math.max(range.from, startOf(first)),
        to: Math.min(range.to, endOf(last)),
      },
      widen,
      out,
    )
  }
  if (current) out.push(current)
}

/**
 * Moves the segment ends off spaces, line breaks and the `>` / indentation that start a continuation line (markers
 * there would break the block), and out of backslash escapes.
 */
function trimSegment(text: string, segment: Range): Range | null {
  let { from, to } = segment
  const isPrefix = (offset: number) => /^[ \t>]*$/.test(text.slice(text.lastIndexOf("\n", offset - 1) + 1, offset + 1))
  while (from < to && (/\s/.test(text[from] ?? "") || (text[from] === ">" && isPrefix(from)))) from++
  while (to > from && (/\s/.test(text[to - 1] ?? "") || (text[to - 1] === ">" && isPrefix(to - 1)))) to--
  if (escapes(text, from - 1)) from--
  if (escapes(text, to - 1)) to = Math.min(text.length, to + 1)
  return from < to ? { from, to } : null
}

/** Whether the character at `offset` is a backslash that escapes the next one. */
function escapes(text: string, offset: number): boolean {
  if (text[offset] !== "\\" || !/[!-/:-@[-`{-~]/.test(text[offset + 1] ?? "")) return false
  let backslashes = 0
  while (text[offset - backslashes] === "\\") backslashes++
  return backslashes % 2 === 1
}

// - - - Widening - - -

/** Widens the range over formulas, inline code, raw HTML and links it cuts in half. */
function widenOverAtoms(index: MarkdownIndex, range: Range): Range {
  let { from, to } = range
  const atoms = [
    ...index.leaves.filter((leaf) => leaf.atomic),
    ...index.formats.filter((span) => span.format === "code"),
    ...index.links,
  ]
  for (const atom of atoms) {
    if (atom.start < from && from < atom.end) from = atom.start
    if (atom.start < to && to < atom.end) to = atom.end
  }
  return { from, to }
}

function widenToWords(text: string, range: Range): Range {
  let { from, to } = range
  while (from > 0 && /\S/.test(text[from - 1] ?? "")) from--
  while (to < text.length && /\S/.test(text[to] ?? "")) to++
  return { from, to }
}

// - - - Checking the result - - -

function visibleText(index: MarkdownIndex): string {
  return index.leaves.map((leaf) => leaf.value).join("")
}

/** How many visible characters each format covers in `[from, to)`. */
function countFormats(index: MarkdownIndex, mask: Uint8Array, from: number, to: number): Record<Marked, number> {
  const counts = {
    bold: 0,
    italic: 0,
    underline: 0,
    strike: 0,
    code: 0,
    spoiler: 0,
    link: 0,
  }
  for (const offset of visibleOffsets(index, from, to)) {
    for (const format of MARKED) if (((mask[offset] ?? 0) & BITS[format]) !== 0) counts[format]++
  }
  return counts
}

/**
 * The toggled text must read as before except for `format`: same visible text, same coverage of every other
 * format, and `format` on (or off) for the whole selection, with the rest of a split span still formatted.
 */
function keepsEverythingElse(
  before: MarkdownIndex,
  selection: TextState,
  result: TextState,
  format: InlineFormat,
  on: boolean,
): boolean {
  const after = indexMarkdown(result.text)
  if (visibleText(before) !== visibleText(after)) return false
  const maskBefore = formatMask(before)
  const maskAfter = formatMask(after)
  const countsBefore = countFormats(before, maskBefore, 0, before.text.length)
  const countsAfter = countFormats(after, maskAfter, 0, after.text.length)
  if (MARKED.some((other) => other !== format && countsBefore[other] !== countsAfter[other])) return false
  if (on) {
    return countsAfter[format] > countsBefore[format] && activeIn(after, maskAfter, format, result.start, result.end)
  }
  const removed = countFormats(before, maskBefore, selection.start, selection.end)[format]
  const left = countFormats(after, maskAfter, result.start, result.end)[format]
  return left === 0 && countsAfter[format] === countsBefore[format] - removed
}
