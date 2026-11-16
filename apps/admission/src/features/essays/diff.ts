/** One run of a word diff: kept, added in the newer text, or removed from the older one. */
export type DiffPart = { op: "same" | "add" | "del"; text: string }

/** Beyond this many words on either side the diff is skipped (the LCS table is quadratic). */
export const DIFF_MAX_WORDS = 3000

/** Word-level diff of two texts (longest common subsequence); whitespace stays with the word before it. */
export function wordDiff(older: string, newer: string): DiffPart[] | null {
  const a = older.match(/\S+\s*/g) ?? []
  const b = newer.match(/\S+\s*/g) ?? []
  if (a.length > DIFF_MAX_WORDS || b.length > DIFF_MAX_WORDS) return null
  const key = (w: string) => w.trim()
  const n = a.length
  const m = b.length
  const table = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      table[i]![j] =
        key(a[i]!) === key(b[j]!) ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!)
  const parts: DiffPart[] = []
  const push = (op: DiffPart["op"], text: string) => {
    const last = parts[parts.length - 1]
    if (last?.op === op) last.text += text
    else parts.push({ op, text })
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (key(a[i]!) === key(b[j]!)) {
      push("same", b[j]!)
      i++
      j++
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) push("del", a[i++]!)
    else push("add", b[j++]!)
  }
  while (i < n) push("del", a[i++]!)
  while (j < m) push("add", b[j++]!)
  return parts
}

/** Counts words the way the backend does: runs of non-space characters. */
export function countWords(text: string): number {
  return text.match(/\S+/g)?.length ?? 0
}
