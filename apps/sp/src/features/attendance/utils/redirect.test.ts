import { describe, expect, it } from "bun:test"
import { calendarRedirect } from "./redirect"

describe("the old attendance address", () => {
  it("goes to the month view of the calendar", () => {
    expect(calendarRedirect("")).toBe("/timetable/?view=month")
    expect(calendarRedirect("?from=2026-09-02&to=2026-10-07")).toBe("/timetable/?view=month")
  })

  it("keeps the view and the day the address carries", () => {
    expect(calendarRedirect("?view=week")).toBe("/timetable/?view=week")
    expect(calendarRedirect("?view=day&day=2026-10-06")).toBe("/timetable/?view=day&day=2026-10-06")
    expect(calendarRedirect("?view=year&day=nonsense")).toBe("/timetable/?view=month")
  })
})
