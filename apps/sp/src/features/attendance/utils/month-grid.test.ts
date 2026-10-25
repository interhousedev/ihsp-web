import { describe, expect, it } from "bun:test"
import { firstOfMonth, monthGrid, monthOf, shiftMonth } from "./month-grid"

describe("month grid", () => {
  it("cuts the month out of a date", () => {
    expect(monthOf("2026-10-07")).toBe("2026-10")
    expect(firstOfMonth("2026-10-07")).toBe("2026-10-01")
  })

  it("shifts months across years", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01")
    expect(shiftMonth("2026-01", -1)).toBe("2025-12")
  })

  it("lays out Monday-first weeks padded with nulls", () => {
    const weeks = monthGrid("2026-10")
    expect(weeks[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"])
    expect(weeks.every((week) => week.length === 7)).toBe(true)
  })
})
