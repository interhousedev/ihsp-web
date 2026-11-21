import type { GanttTone } from "./gantt-model"
import { BACK_DAYS, MIN_DAYS, deadlineKind, utcDay } from "./gantt-model"

const DAY = 86_400_000

/** One dated item of a student on the caseload (`GET /v1/admission/staff/caseload-deadlines`). */
export type CaseloadDeadline = {
  by_staff: boolean
  date: string
  group_name: string | null
  href: string
  kind: string
  list_entry_id: string | null
  student_id: string
  student_name: string | null
  title: string
}

export type StudentTimeline = {
  studentId: string
  name: string | null
  groupName: string | null
  /** Items sorted by date; a flag stands for every item of its day. */
  days: { day: number; items: CaseloadDeadline[]; tone: GanttTone; byStaff: boolean }[]
}

function toneOf(items: CaseloadDeadline[], today: number, day: number): GanttTone {
  if (items.some((item) => item.by_staff)) return day < today ? "muted" : "info"
  if (day < today) return "muted"
  const first = items[0]!
  if (first.kind === "task") return "primary"
  return deadlineKind(first.title) === "early" ? "warning" : "accent"
}

/** Students in the order of their first upcoming item (students with nothing upcoming last); items grouped per day. */
export function groupByStudent(items: CaseloadDeadline[], today: number): StudentTimeline[] {
  const byStudent = new Map<string, CaseloadDeadline[]>()
  for (const item of items) byStudent.set(item.student_id, [...(byStudent.get(item.student_id) ?? []), item])
  const out: StudentTimeline[] = []
  for (const [studentId, rows] of byStudent) {
    const perDay = new Map<number, CaseloadDeadline[]>()
    for (const row of rows) {
      const day = utcDay(row.date)
      perDay.set(day, [...(perDay.get(day) ?? []), row])
    }
    const days = [...perDay.entries()]
      .sort(([a], [b]) => a - b)
      .map(([day, list]) => ({
        day,
        items: list,
        tone: toneOf(list, today, day),
        byStaff: list.some((item) => item.by_staff),
      }))
    out.push({ studentId, name: rows[0]!.student_name, groupName: rows[0]!.group_name, days })
  }
  const next = (row: StudentTimeline) => row.days.find((d) => d.day >= today)?.day ?? Number.POSITIVE_INFINITY
  return out.sort((a, b) => next(a) - next(b) || (a.name ?? "").localeCompare(b.name ?? ""))
}

/** Visible span: two weeks back (or the earliest item) to the last item, at least ten weeks, capped at 400 days. */
export function timelineRange(rows: StudentTimeline[], today: number): { start: number; end: number } {
  const days = rows.flatMap((row) => row.days.map((d) => d.day))
  const first = Math.min(today - BACK_DAYS * DAY, ...days)
  const last = Math.max(today + MIN_DAYS * DAY, ...days)
  return { start: Math.max(first, today - 400 * DAY), end: Math.min(last, today + 400 * DAY) }
}
