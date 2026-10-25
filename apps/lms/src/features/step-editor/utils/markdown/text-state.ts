/** The editor text with its selection (`start <= end`, offsets into `text`). */
export interface TextState {
  text: string
  start: number
  end: number
}

/** Replace `text[from, to)` by `insert`. Changes applied together must not overlap. */
export interface Change {
  from: number
  to: number
  insert: string
}

/** The smallest single replacement that turns `before` into `after` (one native undo step), or `null` if equal. */
export interface Replacement {
  from: number
  to: number
  insert: string
}

/**
 * Applies non-overlapping changes and maps the selection through them. The selection start moves after text inserted
 * at its position (opening markers stay outside the selection) and the end stays before it (closing markers too).
 */
export function applyChanges(state: TextState, changes: Change[]): TextState {
  const sorted = changes.toSorted((a, b) => a.from - b.from || a.to - b.to)
  let text = ""
  let cursor = 0
  for (const change of sorted) {
    text += state.text.slice(cursor, change.from) + change.insert
    cursor = change.to
  }
  text += state.text.slice(cursor)
  const start = mapPosition(state.start, sorted, "after")
  const end = Math.max(start, mapPosition(state.end, sorted, "before"))
  return { text, start, end }
}

/** Where `position` ends up after `changes` (sorted); `side` says where it goes when text is inserted right there. */
export function mapPosition(position: number, changes: Change[], side: "before" | "after"): number {
  let delta = 0
  for (const change of changes) {
    const growth = change.insert.length - (change.to - change.from)
    if (change.to < position || (change.to === position && change.from < change.to)) {
      delta += growth
      continue
    }
    if (change.from === position && change.to === position) {
      if (side === "after") delta += change.insert.length
      continue
    }
    if (change.from < position && position < change.to) {
      return change.from + delta + (side === "after" ? change.insert.length : 0)
    }
    break
  }
  return position + delta
}

/** The minimal replacement between two texts: common prefix and suffix are kept. */
export function replacementBetween(before: string, after: string): Replacement | null {
  if (before === after) return null
  let prefix = 0
  const shorter = Math.min(before.length, after.length)
  while (prefix < shorter && before[prefix] === after[prefix]) prefix++
  let suffix = 0
  while (suffix < shorter - prefix && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) {
    suffix++
  }
  return {
    from: prefix,
    to: before.length - suffix,
    insert: after.slice(prefix, after.length - suffix),
  }
}

/** The start offsets of the lines touched by `[start, end)` (a selection ending at a line start skips that line). */
export function touchedLines(text: string, start: number, end: number): { from: number; to: number } {
  const from = text.lastIndexOf("\n", start - 1) + 1
  const last = end > start && text[end - 1] === "\n" ? end - 1 : end
  const lineEnd = text.indexOf("\n", last)
  return { from, to: lineEnd === -1 ? text.length : lineEnd }
}
