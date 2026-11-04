import { describe, expect, test } from "bun:test"
import { weekSquares } from "./week-squares"

const lessons = [
  { id: "m1", date: "2026-11-02" },
  { id: "m2", date: "2026-11-02" },
  { id: "w1", date: "2026-11-04" },
  { id: "f1", date: "2026-11-06" },
]
const missed = [{ lessonId: "m2", excused: false }]

describe("attendance week squares", () => {
  test("one square per lesson, grouped by weekday Monday to Friday", () => {
    const days = weekSquares(lessons, missed, "2026-11-04")
    expect(days.map((day) => day.weekday)).toEqual([1, 2, 3, 4, 5])
    expect(days[0]?.squares.map((square) => square.state)).toEqual(["present", "absent"])
    expect(days[2]?.squares.map((square) => square.state)).toEqual(["not_taken"])
  })

  test("a lesson after today has no state yet", () => {
    const days = weekSquares(lessons, missed, "2026-11-04")
    expect(days[4]?.squares.map((square) => square.state)).toEqual(["future"])
  })

  test("an excused absence is its own state", () => {
    const days = weekSquares(lessons, [{ lessonId: "m2", excused: true }], "2026-11-09")
    expect(days[0]?.squares[1]?.state).toBe("excused")
  })
})
