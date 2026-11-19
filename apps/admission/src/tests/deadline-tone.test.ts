import { describe, expect, test } from "bun:test"
import { compareDeadline, daysLeft, deadlineTone } from "../lib/deadline-tone"

const now = new Date("2026-11-19T10:00:00Z")

describe("deadline tone", () => {
  test("counts days from the Tashkent date", () => {
    expect(daysLeft("2026-11-19", now)).toBe(0)
    expect(daysLeft("2026-12-19", now)).toBe(30)
    expect(daysLeft("2026-11-18", now)).toBe(-1)
    // 20:00 UTC is already the next day in Tashkent
    expect(daysLeft("2026-11-20", new Date("2026-11-19T20:00:00Z"))).toBe(0)
  })
  test("urgent within 30 days inclusive", () => {
    expect(deadlineTone("2026-11-19", now)).toBe("urgent")
    expect(deadlineTone("2026-12-19", now)).toBe("urgent")
    expect(deadlineTone("2026-12-20", now)).toBe("normal")
    expect(deadlineTone("2026-11-01", now)).toBe("past")
    expect(deadlineTone(null, now)).toBe("normal")
  })
  test("approaching first, undated last", () => {
    expect(["2027-01-01", null, "2026-12-01"].toSorted(compareDeadline)).toEqual(["2026-12-01", "2027-01-01", null])
  })
})
