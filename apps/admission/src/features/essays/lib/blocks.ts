export type Block =
  | { kind: "paragraph"; n: number; start: number; end: number }
  | { kind: "transition"; start: number; end: number }

const BREAK_MAX = 12
const NO_WORDS = /^[^\p{L}\p{N}]+$/u

/** A short line of only punctuation/symbols/spaces ("* * *", "---", "___", "§"): a transition, not a paragraph. */
export function isSceneBreak(line: string): boolean {
  const s = line.trim()
  return s.length > 0 && s.length <= BREAK_MAX && NO_WORDS.test(s)
}

/** Same rule as the server (domain/essay_text.py): paragraphs are numbered from 1, scene breaks are transitions. */
export function splitBlocks(body: string): Block[] {
  const blocks: Block[] = []
  let count = 0
  let from = -1
  let to = -1
  const flush = () => {
    if (from >= 0) blocks.push({ kind: "paragraph", n: ++count, start: from, end: to })
    from = -1
  }
  let offset = 0
  for (const raw of body.split("\n")) {
    const lead = raw.length - raw.trimStart().length
    const text = raw.trim()
    const start = offset + lead
    offset += raw.length + 1
    if (!text) flush()
    else if (isSceneBreak(text)) {
      flush()
      blocks.push({ kind: "transition", start, end: start + text.length })
    } else {
      if (from < 0) from = start
      to = start + text.length
    }
  }
  flush()
  return blocks
}
