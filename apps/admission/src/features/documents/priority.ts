import type { ChecklistItem } from "./api"

export type ChecklistSort = "urgency" | "importance" | "deadline" | "status"
export type Quadrant = ChecklistItem["quadrant"]

export const SORTS: readonly ChecklistSort[] = ["urgency", "importance", "deadline", "status"]
export const QUADRANTS: readonly Quadrant[] = ["do", "schedule", "delegate", "drop"]

const STATUS_RANK: Record<string, number> = {
  in_progress: 0,
  todo: 1,
  confirm_with_uni: 2,
  n_a: 3,
  done: 4,
}

const finished = (i: ChecklistItem) => i.status === "done" || i.status === "n_a"
const due = (i: ChecklistItem) => (i.due_utc ? Date.parse(i.due_utc) : Number.POSITIVE_INFINITY)
const flag = (b: boolean) => (b ? 0 : 1)

type Compare = (a: ChecklistItem, b: ChecklistItem) => number

/** Tie-breakers run in order; finished items always sink so open work stays on top. */
const COMPARATORS: Record<ChecklistSort, Compare[]> = {
  urgency: [
    (a, b) => flag(a.urgent) - flag(b.urgent),
    (a, b) => due(a) - due(b),
    (a, b) => flag(a.important) - flag(b.important),
  ],
  importance: [
    (a, b) => flag(a.important) - flag(b.important),
    (a, b) => flag(a.urgent) - flag(b.urgent),
    (a, b) => due(a) - due(b),
  ],
  deadline: [(a, b) => due(a) - due(b), (a, b) => flag(a.important) - flag(b.important)],
  status: [(a, b) => (STATUS_RANK[a.status] ?? 1) - (STATUS_RANK[b.status] ?? 1), (a, b) => due(a) - due(b)],
}

function compare(sort: ChecklistSort): Compare {
  return (a, b) => {
    if (sort !== "status" && finished(a) !== finished(b)) return finished(a) ? 1 : -1
    for (const cmp of COMPARATORS[sort]) {
      const d = cmp(a, b)
      if (d !== 0 && !Number.isNaN(d)) return d
    }
    return 0
  }
}

/** A sorted copy; Array.sort is stable so equal items keep the server order. */
export function sortChecklist(items: readonly ChecklistItem[], sort: ChecklistSort): ChecklistItem[] {
  return [...items].sort(compare(sort))
}

/** Eisenhower grouping: every quadrant is present (possibly empty), items sorted by urgency. */
export function groupChecklist(items: readonly ChecklistItem[]): Record<Quadrant, ChecklistItem[]> {
  const sorted = sortChecklist(items, "urgency")
  const out: Record<Quadrant, ChecklistItem[]> = { do: [], schedule: [], delegate: [], drop: [] }
  for (const item of sorted) out[item.quadrant].push(item)
  return out
}
