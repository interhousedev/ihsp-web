import type { PromptLocale } from "@ihsp/api"

export const PROMPT_LOCALES: readonly PromptLocale[] = ["", "uz", "ru", "en"]

export type DiffLine = { kind: "same" | "added" | "removed"; text: string }

/** A line diff (longest common subsequence) of the built-in text against the text in force. */
export function diffLines(builtin: string, current: string): DiffLine[] {
  const a = builtin.split("\n")
  const b = current.split("\n")
  const table = Array.from({ length: a.length + 1 }, () => Array.from({ length: b.length + 1 }, () => 0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: "same", text: a[i] })
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.push({ kind: "removed", text: a[i++] })
    } else {
      out.push({ kind: "added", text: b[j++] })
    }
  }
  while (i < a.length) out.push({ kind: "removed", text: a[i++] })
  while (j < b.length) out.push({ kind: "added", text: b[j++] })
  return out
}

/** The slot key kept in the address: `task/name`. */
export function slotKey(slot: { task: string; name: string }): string {
  return `${slot.task}/${slot.name}`
}

export function parseSlotKey(key: string | null): { task: string; name: string } | null {
  if (!key) return null
  const at = key.indexOf("/")
  return at > 0 && at < key.length - 1 ? { task: key.slice(0, at), name: key.slice(at + 1) } : null
}

/** The message key of a slot's description: the backend summary as a snake_case slug. */
export function summaryKey(summary: string): string {
  return `summaries.${summary
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}`
}
