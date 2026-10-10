/** WEB-17, UF-WEB-12: the student's attendance on the calendar: the month, the counts and the summary. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, lessonId, server, studentAttendance } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { monthGrid, shiftMonth } from "../features/attendance/utils/month-grid"
import { configureTests, freezeTime, renderSp, setViewportWidth, unfreezeTime } from "./helpers"

configureTests()

beforeEach(() => {
  freezeTime()
  setViewportWidth(1280)
})
afterEach(() => {
  unfreezeTime()
  setViewportWidth(1280)
})

/** The month of the calendar: the address opens it (today's month without a `day`). */
const MONTH = "/timetable/?view=month"

describe("month view of the calendar", () => {
  test("the days carry the attendance: a red dot for absences, an orange dot for late, a green dot for present", async () => {
    server.use(
      http.get(apiUrl("/v1/me/attendance"), () =>
        HttpResponse.json({ ...studentAttendance, days: [{ date: "2026-10-06", absences: 1 }] }),
      ),
      http.get(apiUrl("/v1/me/timetable"), () =>
        HttpResponse.json([
          { id: "lesson-late", date: "2026-10-05" },
          { id: "lesson-present", date: "2026-10-02" },
        ]),
      ),
      http.get(apiUrl("/v1/me/lesson-results"), () =>
        HttpResponse.json([
          { lesson_id: "lesson-late", attendance: "late", mark: null },
          { lesson_id: "lesson-present", attendance: "present", mark: null },
        ]),
      ),
    )
    renderSp(<TimetablePage />, { route: MONTH })

    const late = await waitFor(async () => {
      const day = await screen.findByRole("button", { name: "5 October" })
      if (!day.querySelector('[data-dot="late"]')) throw new Error("no late dot yet")
      return day
    })
    expect(late.querySelector('[data-dot="late"]')).toHaveClass("bg-orange-700")
    expect(late.querySelector('[data-dot="absent"]')).toBeNull()

    const absent = screen.getByRole("button", { name: /^6 October: 1 absence$/ })
    expect(absent.querySelector('[data-dot="absent"]')).toHaveClass("bg-red-800")
    expect(absent.querySelector('[data-dot="late"]')).toBeNull()

    expect(screen.getByRole("button", { name: "2 October" }).querySelector('[data-dot="present"]')).toHaveClass(
      "bg-green-600",
    )
  })

  test("tapping a day opens it in the day view", async () => {
    const { user } = renderSp(<TimetablePage />, { route: MONTH })

    await user.click(await screen.findByRole("button", { name: /^6 October: 1 absence$/ }))

    expect(await screen.findByRole("button", { name: /^Tuesday/ })).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByText("Missed lessons")).not.toBeInTheDocument()
  })

  test("the month lists the lessons missed in it, newest first", async () => {
    renderSp(<TimetablePage />, { route: MONTH })

    await screen.findByRole("heading", { name: "Missed lessons" })

    // The fixture has one missed lesson in October (6 October, Chemistry); the others are in September.
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(1)
    expect(within(links[0] as HTMLElement).getByText("Chemistry")).toBeInTheDocument()
  })

  test("the month follows the address and can be changed", async () => {
    const { user } = renderSp(<TimetablePage />, { route: "/timetable/?view=month&day=2026-12-03" })

    expect(await screen.findByRole("heading", { name: "December 2026" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Next month" }))
    expect(await screen.findByRole("heading", { name: "January 2027" })).toBeInTheDocument()
  })

  test("the month counts show the absent, late and present lessons of the month", async () => {
    server.use(
      http.get(apiUrl("/v1/me/lesson-results"), () =>
        HttpResponse.json([
          { lesson_id: lessonId(1, 1), attendance: "present", mark: null },
          { lesson_id: lessonId(1, 2), attendance: "present", mark: null },
          { lesson_id: lessonId(2, 1), attendance: "late", mark: null },
          { lesson_id: lessonId(2, 2), attendance: "absent", mark: null },
          { lesson_id: lessonId(3, 1), attendance: "absent", mark: null },
        ]),
      ),
    )
    renderSp(<TimetablePage />, { route: MONTH })

    const month = (await screen.findByRole("heading", { name: "This month October 2026" })).parentElement as HTMLElement
    expect(month).toHaveTextContent("Absent2")
    expect(month).toHaveTextContent("Late1")
    expect(month).toHaveTextContent("Present2")
  })

  test("the semester totals come from the summary of the term", async () => {
    renderSp(<TimetablePage />, { route: MONTH })

    const semester = (await screen.findByRole("heading", { name: "This semester" })).parentElement as HTMLElement
    // Absences 5 (2+0+1+0+1+1), excused 1, lessons 62 (14+12+10+8+9+9).
    expect(within(semester).getByText("5")).toBeInTheDocument()
    expect(within(semester).getByText("1")).toBeInTheDocument()
    expect(within(semester).getByText("62")).toBeInTheDocument()
  })

  test("the summary lists absences, excused, lessons and the rate of each subject", async () => {
    renderSp(<TimetablePage />, { route: MONTH })

    const table = await screen.findByRole("table")
    const rows = within(table).getAllByRole("row")

    expect(rows).toHaveLength(studentAttendance.summary.length + 1)
    const math = within(rows.find((row) => within(row).queryByText("Mathematics")) as HTMLElement)
    expect(math.getByText("14%")).toBeInTheDocument()
  })

  test("on a phone the summary is a list of cards", async () => {
    setViewportWidth(360)
    renderSp(<TimetablePage />, { route: MONTH })

    await screen.findByText("Summary by subject")

    expect(await screen.findAllByText(/Absences: \d/)).toHaveLength(studentAttendance.summary.length)
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  test("says how many lessons have no attendance taken yet", async () => {
    renderSp(<TimetablePage />, { route: MONTH })

    expect(await screen.findByTestId("not-taken")).toHaveTextContent(
      "1 lesson has no attendance taken yet and is not counted.",
    )
  })

  test("a semester without attendance shows the friendly message", async () => {
    server.use(
      http.get(apiUrl("/v1/me/attendance"), () =>
        HttpResponse.json({ from: "2026-09-02", to: "2026-10-07", summary: [], days: [], missed: [], not_taken: 0 }),
      ),
    )
    renderSp(<TimetablePage />, { route: MONTH })

    expect(await screen.findByText("No lessons with attendance this semester.")).toBeInTheDocument()
    expect(screen.queryByTestId("not-taken")).not.toBeInTheDocument()
    expect(screen.getByText("No missed lessons.")).toBeInTheDocument()
  })
})

describe("month grid", () => {
  test("weeks start on Monday and the neighbouring months are blank", () => {
    const weeks = monthGrid("2026-10")

    expect(weeks[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"])
    expect(weeks.at(-1)?.[4]).toBe("2026-10-30")
    expect(weeks.every((week) => week.length === 7)).toBe(true)
  })

  test("shiftMonth crosses year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01")
    expect(shiftMonth("2026-01", -1)).toBe("2025-12")
  })

  test("the calendar opens on the month of the day in the address", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/?view=month&day=2026-12-20" })

    expect(await screen.findByRole("heading", { name: "December 2026" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "October 2026" })).not.toBeInTheDocument()
  })
})
