import { describe, expect, test } from "bun:test"
import { academicWeek } from "./academic-week"

const semesters = [
  { starts_on: "2025-09-02", ends_on: "2026-01-10" },
  { starts_on: "2026-01-12", ends_on: "2026-06-20" },
  { starts_on: "2026-09-01", ends_on: "2027-01-16" },
]

describe("academic week", () => {
  test("week 1 is the week holding the start of the year, even its Monday before the start", () => {
    expect(academicWeek("2026-08-31", semesters)).toBe(1)
    expect(academicWeek("2026-09-06", semesters)).toBe(1)
    expect(academicWeek("2026-09-07", semesters)).toBe(2)
  })

  test("the spring semester keeps counting from the autumn start", () => {
    expect(academicWeek("2026-01-12", semesters)).toBe(20)
  })

  test("the summer has no academic week and the next autumn starts at 1 again", () => {
    expect(academicWeek("2026-07-15", semesters)).toBeNull()
    expect(academicWeek("2026-10-05", semesters)).toBe(6)
  })

  test("without known dates there is no week number", () => {
    expect(academicWeek("2026-10-05", [])).toBeNull()
    expect(academicWeek("2026-10-05", [{ starts_on: null, ends_on: null }])).toBeNull()
  })
})
