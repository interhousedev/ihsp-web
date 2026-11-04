/** The unbounded lists of the staff app are named scroll regions, so a keyboard user can reach and scroll them. */
import { describe, expect, test } from "bun:test"
import { weekLessons } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { TimetableDayList } from "../features/timetable/components/timetable-day-list"
import { configureTests, renderStaff } from "./helpers"

configureTests()

describe("scroll lists", () => {
  test("the lessons of a day on the phone timetable are a named, focusable scroll region", async () => {
    renderStaff(
      <TimetableDayList
        monday="2026-10-05"
        day="2026-10-05"
        onDayChange={() => {}}
        lessons={weekLessons}
        now={Date.parse("2026-10-05T10:00:00+05:00")}
      />,
    )

    const region = await screen.findByRole("region", { name: "Lessons of the day" })

    expect(region).toHaveAttribute("tabindex", "0")
    expect(region.querySelectorAll("li").length).toBeGreaterThan(0)
  })
})
