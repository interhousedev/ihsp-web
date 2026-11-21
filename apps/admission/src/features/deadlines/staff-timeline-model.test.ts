import { describe, expect, test as it } from "bun:test"
import { groupByStudent, timelineRange, type CaseloadDeadline } from "./staff-timeline-model"

const DAY = 86_400_000
const today = Date.UTC(2026, 10, 21)
const row = (student: string, date: string, extra: Partial<CaseloadDeadline> = {}): CaseloadDeadline => ({
  by_staff: false,
  date,
  group_name: null,
  href: "/x",
  kind: "university",
  list_entry_id: null,
  student_id: student,
  student_name: student,
  title: "RD",
  ...extra,
})

describe("caseload timeline", () => {
  it("groups per student and per day, soonest student first", () => {
    const rows = groupByStudent(
      [row("b", "2026-12-20"), row("a", "2026-12-01"), row("a", "2026-12-01", { title: "Essay" }), row("c", "2026-10-01")],
      today,
    )
    expect(rows.map((r) => r.studentId)).toEqual(["a", "b", "c"])
    expect(rows[0]!.days).toHaveLength(1)
    expect(rows[0]!.days[0]!.items).toHaveLength(2)
  })

  it("marks days with a staff task and fades the past", () => {
    const [a, b] = groupByStudent([row("a", "2026-12-01", { by_staff: true, kind: "task" }), row("b", "2026-10-01")], today)
    expect(a!.days[0]).toMatchObject({ byStaff: true, tone: "info" })
    expect(b!.days[0]!.tone).toBe("muted")
  })

  it("spans at least ten weeks and covers late items", () => {
    expect(timelineRange([], today).end).toBe(today + 70 * DAY)
    const rows = groupByStudent([row("a", "2027-03-01")], today)
    expect(timelineRange(rows, today).end).toBe(Date.UTC(2027, 2, 1))
  })
})
