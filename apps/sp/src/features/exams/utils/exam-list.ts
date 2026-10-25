import type { AssessmentItem } from "@ihsp/api"

function bySubjectName(a: AssessmentItem, b: AssessmentItem): number {
  return a.subject.name.localeCompare(b.subject.name)
}

/** Soonest first; on one day dated controls come before the weeks without a date, then by start time and subject. */
function soonestFirst(a: AssessmentItem, b: AssessmentItem): number {
  return (
    a.date.localeCompare(b.date) ||
    Number(b.has_date) - Number(a.has_date) ||
    (a.starts_at ?? "").localeCompare(b.starts_at ?? "") ||
    bySubjectName(a, b)
  )
}

/** Upcoming controls (today included) soonest first, past ones most recent first; `days_left` is the server's. */
export function splitExams(items: AssessmentItem[]): { upcoming: AssessmentItem[]; past: AssessmentItem[] } {
  return {
    upcoming: items.filter((item) => item.days_left >= 0).toSorted(soonestFirst),
    past: items.filter((item) => item.days_left < 0).toSorted((a, b) => soonestFirst(b, a)),
  }
}

/** Consecutive controls of one month (`YYYY-MM`), keeping the order of the list. */
export function groupByMonth(items: AssessmentItem[]): { month: string; items: AssessmentItem[] }[] {
  const groups: { month: string; items: AssessmentItem[] }[] = []
  for (const item of items) {
    const month = item.date.slice(0, 7)
    const last = groups.at(-1)
    if (last?.month === month) last.items.push(item)
    else groups.push({ month, items: [item] })
  }
  return groups
}

/** Every subject that has a control in the list, once, by name (for the filter). */
export function subjectsOf(items: AssessmentItem[]): { id: string; name: string }[] {
  const byId = new Map(items.map((item) => [item.subject.id, item.subject.name]))
  return [...byId].map(([id, name]) => ({ id, name })).toSorted((a, b) => a.name.localeCompare(b.name))
}

export function filterBySubject(items: AssessmentItem[], subjectId: string | null): AssessmentItem[] {
  return subjectId ? items.filter((item) => item.subject.id === subjectId) : items
}

/** There is no get-by-id endpoint: the control is found in the list the page already loaded. */
export function findExam(items: AssessmentItem[], id: string | null): AssessmentItem | null {
  return id ? (items.find((item) => item.id === id) ?? null) : null
}
