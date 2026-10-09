/**
 * One source line split into the parts line formats work on: `> ` quote markers, indentation, a list marker, a
 * heading marker and the rest. Only the leading markers of a line are read; the text after them is never touched.
 */
export interface Line {
  /** Offset of the line start in the text. */
  start: number
  text: string
  quote: string
  indent: string
  marker: string
  heading: string
  rest: string
}

const LINE = /^((?: {0,3}>[ \t]?)*)([ \t]*)((?:[-*+]|\d{1,9}[.)])(?:[ \t]+|$))?(#{1,6}(?:[ \t]+|$))?(.*)$/

export function parseLine(text: string, start: number): Line {
  const match = LINE.exec(text)
  return {
    start,
    text,
    quote: match?.[1] ?? "",
    indent: match?.[2] ?? "",
    marker: match?.[3] ?? "",
    heading: match?.[4] ?? "",
    rest: match?.[5] ?? text,
  }
}

export function joinLine(line: Pick<Line, "quote" | "indent" | "marker" | "heading" | "rest">): string {
  return line.quote + line.indent + line.marker + line.heading + line.rest
}

/** The lines of `text` from the line holding `from` to the line holding `to` (inclusive). */
export function linesBetween(text: string, from: number, to: number): Line[] {
  const lines: Line[] = []
  let start = text.lastIndexOf("\n", from - 1) + 1
  while (start <= to) {
    const newline = text.indexOf("\n", start)
    const end = newline === -1 ? text.length : newline
    lines.push(parseLine(text.slice(start, end), start))
    if (newline === -1) break
    start = newline + 1
  }
  return lines
}

export function isBlank(line: Line): boolean {
  return (
    line.text.trim() === "" ||
    (line.quote !== "" && (line.indent + line.marker + line.heading + line.rest).trim() === "")
  )
}

export function quoteDepth(line: Line): number {
  return (line.quote.match(/>/g) ?? []).length
}

export function isBullet(line: Line): boolean {
  return /^[-*+]/.test(line.marker)
}

export function isOrdered(line: Line): boolean {
  return /^\d/.test(line.marker)
}

export function headingLevel(line: Line): number {
  return line.heading.trim().length
}

/** A line that starts a block of its own (heading, list item, fence, thematic break, table row) rather than text. */
function startsBlock(line: Line): boolean {
  const inner = line.indent + line.marker + line.heading + line.rest
  return (
    line.marker !== "" ||
    line.heading !== "" ||
    /^ {0,3}(`{3,}|~{3,}|\${2,})/.test(inner) ||
    /^ {0,3}([-*_])( *\1){2,} *$/.test(inner) ||
    /^ {0,3}</.test(inner)
  )
}

/**
 * Whether `lower` would continue the paragraph of `upper` (they'd render as one paragraph, or `lower` would be pulled
 * into the quote or list item of `upper` as a lazy continuation line).
 */
export function wouldJoin(upper: Line, lower: Line): boolean {
  if (isBlank(upper) || isBlank(lower) || upper.heading !== "" || startsBlock(lower)) return false
  const upperInner = upper.indent + upper.marker + upper.heading + upper.rest
  if (/^ {0,3}(`{3,}|~{3,}|\${2,})/.test(upperInner) || /^ {0,3}([-*_])( *\1){2,} *$/.test(upperInner)) return false
  return quoteDepth(lower) <= quoteDepth(upper)
}

/** The quote markers two lines share, as an empty line inside that quote (`>`), or `""` outside quotes. */
export function separatorBetween(upper: Line, lower: Line): string {
  const depth = Math.min(quoteDepth(upper), quoteDepth(lower))
  return Array.from({ length: depth }, () => ">").join(" ")
}
