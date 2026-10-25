import { indexMarkdown, type MarkdownIndex, type RawBlock } from "./markdown-index"
import { parseLine } from "./markdown-lines"
import { applyChanges, type Change, type TextState, touchedLines } from "./text-state"

const FENCE = /^(?: {0,3}>[ \t]?)*[ \t]*(`{3,}|~{3,})/

/** The fenced code block around the selection, if any. */
export function codeBlockAt(state: TextState, index: MarkdownIndex = indexMarkdown(state.text)): RawBlock | null {
  return (
    index.rawBlocks.find(
      (block) => block.kind === "code" && block.fenced && block.start <= state.start && state.end <= block.end,
    ) ?? null
  )
}

/**
 * Puts the selected lines into a fenced code block (```` ``` ````), or takes the code block around the selection
 * apart again. Inside a quote the fences get the quote markers. On an empty line it inserts an empty block with the
 * caret inside, ready for code. Code blocks are never nested.
 */
export function toggleCodeBlock(state: TextState): TextState {
  const index = indexMarkdown(state.text)
  const block = codeBlockAt(state, index)
  if (block) return unwrapCodeBlock(state, block)
  if (index.rawBlocks.some((raw) => raw.start < state.end && state.start < raw.end)) return state
  return wrapCodeBlock(state)
}

/** Removes the opening fence line and, if the block is closed, the closing one; the code stays. */
function unwrapCodeBlock(state: TextState, block: RawBlock): TextState {
  const { text } = state
  const openStart = text.lastIndexOf("\n", block.start - 1) + 1
  const openEnd = text.indexOf("\n", block.start)
  if (openEnd === -1 || openEnd >= block.end)
    return applyChanges(state, [{ from: openStart, to: block.end, insert: "" }])
  const changes: Change[] = [{ from: openStart, to: openEnd + 1, insert: "" }]
  const lastStart = text.lastIndexOf("\n", block.end - 1) + 1
  const opening = FENCE.exec(text.slice(openStart, openEnd))?.[1] ?? "```"
  const closing = FENCE.exec(text.slice(lastStart, block.end))?.[1]
  if (lastStart > openEnd && closing?.[0] === opening[0] && closing.length >= opening.length) {
    changes.push({ from: lastStart - 1, to: block.end, insert: "" })
  }
  return applyChanges(state, changes)
}

function wrapCodeBlock(state: TextState): TextState {
  const { text } = state
  const { from, to } = touchedLines(text, state.start, state.end)
  const lines = text.slice(from, to).split("\n")
  const quote = parseLine(lines[0] ?? "", from).quote
  const prefix = quote !== "" && lines.every((line) => line.startsWith(quote.trimEnd())) ? quote : ""
  // The lines hold no fence of their own: a selection touching a code block never gets here.
  const fence = "```"
  if (lines.every((line) => line.slice(prefix.length).trim() === "")) {
    const block = `${prefix}${fence}\n${prefix}\n${prefix}${fence}`
    const caret = from + prefix.length + fence.length + 1 + prefix.length
    return {
      text: text.slice(0, from) + block + text.slice(to),
      start: caret,
      end: caret,
    }
  }
  return applyChanges(state, [
    { from, to: from, insert: `${prefix}${fence}\n` },
    { from: to, to, insert: `\n${prefix}${fence}` },
  ])
}
