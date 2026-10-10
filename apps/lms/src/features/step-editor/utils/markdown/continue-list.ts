import { indexMarkdown } from "./markdown-index"
import { isBlank, parseLine } from "./markdown-lines"
import type { TextState } from "./text-state"

/**
 * Enter in a list item or a quote: the new line starts with the next marker (`- `, `2. `, `- [ ] `, `> `). Enter on
 * an empty item or quote line ends the list or quote instead. Returns `null` where Enter should just break the line
 * (plain text, code blocks, a selection).
 */
export function continueList(state: TextState): TextState | null {
  const { text, start, end } = state
  if (start !== end) return null
  const lineStart = text.lastIndexOf("\n", start - 1) + 1
  const lineEndAt = text.indexOf("\n", start)
  const lineEnd = lineEndAt === -1 ? text.length : lineEndAt
  const line = parseLine(text.slice(lineStart, lineEnd), lineStart)
  if (line.marker === "" && line.quote === "") return null
  const prefixLength = line.quote.length + line.indent.length + line.marker.length
  if (start < lineStart + prefixLength) return null
  if (indexMarkdown(text).rawBlocks.some((block) => block.start <= start && start <= block.end)) return null

  if (isBlank(line) || (line.marker !== "" && line.heading === "" && /^(\[[ xX]\][ \t]*)?$/.test(line.rest))) {
    // An empty item or quote line: end the list or quote, keeping outer quote markers.
    const kept = line.marker !== "" ? line.quote : line.quote.replace(/ {0,3}>[ \t]?$/, "")
    const next = text.slice(0, lineStart) + kept + text.slice(lineEnd)
    const caret = lineStart + kept.length
    return { text: next, start: caret, end: caret }
  }
  const insert = `\n${line.quote}${line.indent}${nextMarker(line.marker, line.rest)}`
  const caret = start + insert.length
  return {
    text: text.slice(0, start) + insert + text.slice(end),
    start: caret,
    end: caret,
  }
}

function nextMarker(marker: string, rest: string): string {
  if (marker === "") return ""
  const space = /[ \t]+$/.exec(marker)?.[0] ?? " "
  const ordered = /^(\d+)([.)])/.exec(marker)
  const base = ordered ? `${Number(ordered[1]) + 1}${ordered[2]}${space}` : `${marker.trimEnd()}${space}`
  return /^\[[ xX]\]/.test(rest) ? `${base}[ ] ` : base
}
