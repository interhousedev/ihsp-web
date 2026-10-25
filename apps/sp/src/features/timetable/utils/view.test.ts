import { describe, expect, it } from "bun:test"
import { parseView, samePeriod, stepDate } from "./view"
import { isWeekend, studyDayOf, weekDays, weekRange } from "./week"

describe("calendar view", () => {
  it("reads the view of the address and ignores anything else", () => {
    expect(parseView("day")).toBe("day")
    expect(parseView("week")).toBe("week")
    expect(parseView("month")).toBe("month")
    expect(parseView("year")).toBeNull()
    expect(parseView(null)).toBeNull()
  })

  it("knows when two dates are in the same day, week or month", () => {
    // 2026-10-05 is a Monday, 2026-10-09 the Friday of its study week.
    expect(samePeriod("day", "2026-10-07", "2026-10-07")).toBe(true)
    expect(samePeriod("day", "2026-10-07", "2026-10-08")).toBe(false)
    expect(samePeriod("week", "2026-10-05", "2026-10-09")).toBe(true)
    expect(samePeriod("week", "2026-10-09", "2026-10-12")).toBe(false)
    expect(samePeriod("month", "2026-10-01", "2026-10-31")).toBe(true)
    expect(samePeriod("month", "2026-10-31", "2026-11-01")).toBe(false)
  })

  it("steps a week or a month by calendar length", () => {
    expect(stepDate("week", "2026-10-07", 1)).toBe("2026-10-14")
    expect(stepDate("week", "2026-10-07", -1)).toBe("2026-09-30")
    expect(stepDate("month", "2026-12-15", 1)).toBe("2027-01-01")
    expect(stepDate("month", "2026-10-07", -1)).toBe("2026-09-01")
  })

  it("steps a day to the next study day: Friday goes to Monday, Monday back to Friday", () => {
    // 2026-10-09 is a Friday, 2026-10-12 the Monday after the weekend.
    expect(stepDate("day", "2026-10-09", 1)).toBe("2026-10-12")
    expect(stepDate("day", "2026-10-12", -1)).toBe("2026-10-09")
    expect(stepDate("day", "2026-10-05", -1)).toBe("2026-10-02")
    expect(stepDate("day", "2026-10-07", 1)).toBe("2026-10-08")
  })

  it("a day on the weekend steps to the nearest study day in that direction", () => {
    // 2026-10-10 is a Saturday and 2026-10-11 a Sunday.
    expect(stepDate("day", "2026-10-10", 1)).toBe("2026-10-12")
    expect(stepDate("day", "2026-10-11", -1)).toBe("2026-10-09")
  })
})

describe("study week", () => {
  it("is five days, Monday to Friday, and the week range ends on Friday", () => {
    expect(weekDays("2026-10-05")).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"])
    expect(weekRange("2026-10-05")).toEqual({ from: "2026-10-05", to: "2026-10-09" })
  })

  it("a weekend opens on the Monday after it; a study day stays", () => {
    expect(studyDayOf("2026-10-07")).toBe("2026-10-07")
    expect(studyDayOf("2026-10-10")).toBe("2026-10-12")
    expect(studyDayOf("2026-10-11")).toBe("2026-10-12")
  })

  it("marks Saturday and Sunday as weekend", () => {
    expect(isWeekend("2026-10-09")).toBe(false)
    expect(isWeekend("2026-10-10")).toBe(true)
    expect(isWeekend("2026-10-11")).toBe(true)
    expect(isWeekend("2026-10-12")).toBe(false)
  })
})
