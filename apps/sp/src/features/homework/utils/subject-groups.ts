import type { HomeworkItem, SubjectRef } from "@ihsp/api"

const DAY_MS = 86_400_000

/** Homework grouped by subject, subjects in the order their first item has; a subject with no items is not listed. */
export function groupBySubject(items: readonly HomeworkItem[]): { subject: SubjectRef; items: HomeworkItem[] }[] {
  const groups: { subject: SubjectRef; items: HomeworkItem[] }[] = []
  const bySubject = new Map<string, { subject: SubjectRef; items: HomeworkItem[] }>()
  for (const item of items) {
    const existing = bySubject.get(item.subject.id)
    if (existing) existing.items.push(item)
    else {
      const group = { subject: item.subject, items: [item] }
      bySubject.set(item.subject.id, group)
      groups.push(group)
    }
  }
  return groups
}

/** The calendar day `days` after (or before) `date` (`YYYY-MM-DD`). */
export function shiftDay(date: string, days: -1 | 1): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10)
}
