import type { Importance, ReadingListEntry } from "@ihsp/api"

export type EntryGroup = {
  key: string
  label: string | null
  importance: Importance | null
  entries: ReadingListEntry[]
}

const IMPORTANCE_ORDER: readonly Importance[] = ["essential", "recommended", "further"]

/** Groups the entries by importance (Essential, Recommended, Further) in that order, keeping the entry order inside. */
export function groupByImportance(entries: readonly ReadingListEntry[]): EntryGroup[] {
  return IMPORTANCE_ORDER.map((importance) => ({
    key: importance,
    label: null,
    importance,
    entries: entries.filter((entry) => entry.importance === importance),
  })).filter((group) => group.entries.length > 0)
}

/** Groups the entries by week or term label in the order the labels first appear; entries without one go last. */
export function groupByWeek(entries: readonly ReadingListEntry[]): EntryGroup[] {
  const groups = new Map<string, EntryGroup>()
  const rest: ReadingListEntry[] = []
  for (const entry of entries) {
    if (!entry.week_label) {
      rest.push(entry)
      continue
    }
    const group = groups.get(entry.week_label) ?? {
      key: entry.week_label,
      label: entry.week_label,
      importance: null,
      entries: [],
    }
    group.entries.push(entry)
    groups.set(entry.week_label, group)
  }
  const result = [...groups.values()]
  if (rest.length > 0) result.push({ key: "__rest__", label: null, importance: null, entries: rest })
  return result
}

/** The essential entries the reader has finished (shelf state `done`) and the number of essential entries. */
export function essentialProgress(entries: readonly ReadingListEntry[]): { done: number; total: number } {
  const essential = entries.filter((entry) => entry.importance === "essential")
  return { done: essential.filter((entry) => entry.read_state === "done").length, total: essential.length }
}

export function hasWeekLabels(entries: readonly ReadingListEntry[]): boolean {
  return entries.some((entry) => Boolean(entry.week_label))
}
