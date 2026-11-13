import type { HomeworkItem } from "@ihsp/api"

/** The homework due on one date; `overdue` when any of it is open past its date. */
export type HomeworkDay = { date: string; items: HomeworkItem[]; overdue: boolean }

/** A task is overdue when it is not done and its date has passed. */
export function isOverdue(item: Pick<HomeworkItem, "done_at" | "days_overdue">): boolean {
  return item.done_at === null && item.days_overdue > 0
}

/** The items grouped by due date, earliest first; items without a due date have no day and are left out. */
export function groupByDueDate(items: readonly HomeworkItem[]): HomeworkDay[] {
  const days = new Map<string, HomeworkDay>()
  for (const item of items) {
    if (item.due_date === null) continue
    const day = days.get(item.due_date) ?? { date: item.due_date, items: [], overdue: false }
    day.items.push(item)
    day.overdue ||= isOverdue(item)
    days.set(item.due_date, day)
  }
  return [...days.values()].toSorted((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** The dot of each day on the week strip: error when it holds overdue work, otherwise a plain mark. */
export function dayMarks(days: readonly HomeworkDay[]): Map<string, "error" | "primary"> {
  return new Map(days.map((day) => [day.date, day.overdue ? "error" : "primary"]))
}
