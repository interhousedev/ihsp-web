import { describe, expect, it } from "bun:test"
import { countStates, dayStatus } from "./lesson-states"

const lessons = [
  { id: "l1", date: "2026-10-05" },
  { id: "l2", date: "2026-10-05" },
  { id: "l3", date: "2026-10-06" },
  { id: "l4", date: "2026-10-07" },
]

describe("attendance on the calendar", () => {
  it("a day shows the worst state of its lessons: absent, then late, then present", () => {
    const status = dayStatus(lessons, [
      { lesson_id: "l1", attendance: "present", mark: null },
      { lesson_id: "l2", attendance: "late", mark: null },
      { lesson_id: "l3", attendance: "absent", mark: null },
      { lesson_id: "l4", attendance: "present", mark: 5 },
    ])
    expect(status.get("2026-10-05")).toBe("late")
    expect(status.get("2026-10-06")).toBe("absent")
    expect(status.get("2026-10-07")).toBe("present")
  })

  it("a lesson without attendance taken does not colour its day", () => {
    const status = dayStatus(lessons, [{ lesson_id: "l1", attendance: null, mark: null }])
    expect(status.has("2026-10-05")).toBe(false)
  })

  it("results of lessons outside the list are ignored", () => {
    expect(dayStatus(lessons, [{ lesson_id: "other", attendance: "absent", mark: null }]).size).toBe(0)
  })

  it("counts the states of the lessons, leaving out the ones without attendance", () => {
    expect(
      countStates(lessons, [
        { lesson_id: "l1", attendance: "present", mark: null },
        { lesson_id: "l2", attendance: "late", mark: null },
        { lesson_id: "l3", attendance: "absent", mark: null },
        { lesson_id: "l4", attendance: null, mark: null },
        { lesson_id: "other", attendance: "absent", mark: null },
      ]),
    ).toEqual({ present: 1, late: 1, absent: 1 })
  })
})
