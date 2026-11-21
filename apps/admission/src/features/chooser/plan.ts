import type { TaskIn } from "../tasks/api"
import type { ListEntry } from "./types"

/** The application plan: what a university needs, and how many days before its deadline each piece is due. */
export const PLAN_STEPS = [
  { key: "essays", daysBefore: 21, priority: "high" },
  { key: "recommendations", daysBefore: 35, priority: "high" },
  { key: "transcript", daysBefore: 14, priority: "medium" },
  { key: "aid", daysBefore: 14, priority: "medium" },
  { key: "fee", daysBefore: 7, priority: "low" },
  { key: "submit", daysBefore: 2, priority: "high" },
] as const

export type PlanKey = (typeof PLAN_STEPS)[number]["key"]

const DAY = 86_400_000

const iso = (date: Date) => date.toISOString().slice(0, 10)

/** The deadline of the entry's round that is still ahead, else the university's next one; `null` when none is on file. */
export function planDeadline(entry: ListEntry, today: string): string | null {
  const ahead = entry.institution.deadlines
    .filter((item) => item.plan === entry.round && item.date >= today)
    .map((item) => item.date)
    .toSorted()[0]
  const next = entry.institution.next_deadline
  return ahead ?? (next && next >= today ? next : null)
}

/**
 * The tasks of an application plan for one list entry, back-planned from its deadline. A step that would fall before
 * today is due tomorrow instead of in the past. Without a deadline the tasks carry no dates.
 * `title` and `description` give the words of a step.
 */
export function buildPlan(
  entry: ListEntry,
  today: string,
  words: (key: PlanKey) => { title: string; description: string },
): TaskIn[] {
  const deadline = planDeadline(entry, today)
  const tomorrow = iso(new Date(Date.parse(`${today}T00:00:00Z`) + DAY))
  return PLAN_STEPS.map(({ key, daysBefore, priority }) => {
    const due = deadline ? iso(new Date(Date.parse(`${deadline}T00:00:00Z`) - daysBefore * DAY)) : null
    const { title, description } = words(key)
    return {
      title,
      description,
      priority,
      deadline: due === null || deadline === null ? null : due > today ? due : deadline >= tomorrow ? tomorrow : today,
      list_entry_id: entry.id,
    }
  })
}
