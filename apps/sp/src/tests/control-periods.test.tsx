/** The ПК and ИК weeks sit in the calendar as all-day bars; a tap on one opens its exams and marks. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { screen, waitFor, within } from "@testing-library/react"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { configureTests, freezeTime, renderSp, setViewportWidth, unfreezeTime } from "./helpers"

configureTests()

beforeEach(() => {
  freezeTime()
  setViewportWidth(1280)
})
afterEach(unfreezeTime)

describe("control weeks in the calendar", () => {
  test("the week view draws the period on every one of its dates", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/" })

    await waitFor(() =>
      expect(document.querySelectorAll("[data-control-period='midterm_1']").length).toBeGreaterThan(0),
    )
    const bars = document.querySelectorAll("[data-control-period='midterm_1']")
    expect(bars.length).toBe(5)
    expect(within(bars[0] as HTMLElement).getByText("PC 1")).toBeTruthy()
  })

  test("a tap opens the exams left and the marks, 'No mark yet' for a passed exam without one", async () => {
    const { user } = renderSp(<TimetablePage />, { route: "/timetable/" })

    await waitFor(() => expect(document.querySelectorAll("[data-control-period]").length).toBeGreaterThan(0))
    await user.click(document.querySelectorAll("[data-control-period='midterm_1']")[2] as HTMLElement)

    const dialog = await screen.findByRole("dialog")
    const left = within(dialog).getByRole("list", { name: "Exams left to take" })
    expect(within(left).getByText("Mathematics")).toBeTruthy()
    expect(within(left).getByText("Date not set yet")).toBeTruthy()
    const marks = within(dialog).getByRole("list", { name: "Current marks" })
    expect(within(marks).getByRole("img", { name: "Mark 4" })).toBeTruthy()
    const history = within(marks).getByText("History").closest("li") as HTMLElement
    expect(within(history).getByText("No mark yet")).toBeTruthy()
  })

  test("the month draws the period on its dates and a date inside it opens the same dialog", async () => {
    const { user } = renderSp(<TimetablePage />, { route: "/timetable/?view=month&day=2026-10-07" })

    await waitFor(() => expect(document.querySelectorAll("[data-control-period='midterm_1']").length).toBe(5))
    await user.click(screen.getByRole("button", { name: /^7 October/ }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Exams left to take")).toBeTruthy()
  })
})
