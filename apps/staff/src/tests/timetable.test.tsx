/** STF-3, UF-STF-03: the timetable with warnings. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, makeLesson, server, weekLessons } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { lessonsAt, mondayOf, periodsOf, selectedDay } from "../features/timetable/utils/week"
import { configureTests, freezeTime, hrefOf, renderStaff, setViewportWidth, unfreezeTime } from "./helpers"

configureTests()

beforeEach(() => {
  freezeTime()
  setViewportWidth(1280)
})
afterEach(() => {
  unfreezeTime()
  setViewportWidth(1280)
})

describe("timetable page", () => {
  test("desktop shows the week as a grid with the periods and bell times", async () => {
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    const table = await screen.findByRole("table")

    expect(within(table).getAllByRole("columnheader").length).toBeGreaterThanOrEqual(7)
    expect(within(table).getByText("Period 1")).toBeInTheDocument()
    expect(within(table).getAllByText("Physics").length).toBeGreaterThan(0)
  })

  test("a past lesson without attendance gets a warning badge; one with attendance does not", async () => {
    const missing = makeLesson(
      { weekday: 1, period: 1, subject: "math", room: "r101", subgroup: null },
      { attendance_submitted: false },
    )
    const taken = makeLesson(
      { weekday: 1, period: 2, subject: "physics", room: "r102", subgroup: null },
      { attendance_submitted: true },
    )
    const future = makeLesson(
      { weekday: 5, period: 4, subject: "physics", room: "r102", subgroup: null },
      { attendance_submitted: false },
    )
    server.use(http.get(apiUrl("/v1/staff/timetable"), () => HttpResponse.json([missing, taken, future])))
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    const table = await screen.findByRole("table")

    expect(within(table).getAllByText("Attendance missing")).toHaveLength(1)
    const card = within(table).getAllByText("Mathematics")[0]?.closest("a")
    expect(card).not.toBeNull()
    expect(within(card as HTMLElement).getByText("Attendance missing")).toBeInTheDocument()
  })

  test("a lesson opens its page", async () => {
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    const table = await screen.findByRole("table")
    const link = within(table).getAllByText("Physics")[0]?.closest("a")

    expect(hrefOf(link ?? null)).toMatch(/^\/lessons\/view\/\?id=/)
  })

  test("a cancelled lesson is struck through", async () => {
    const cancelled = makeLesson(
      { weekday: 4, period: 1, subject: "physics", room: "r102", subgroup: null },
      { status: "cancelled", is_overridden: true },
    )
    server.use(http.get(apiUrl("/v1/staff/timetable"), () => HttpResponse.json([cancelled])))
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    await screen.findByRole("table")
    const card = document.querySelector('[data-cancelled="true"]') as HTMLElement

    expect(card).not.toBeNull()
    expect(within(card).getByText("Cancelled")).toBeInTheDocument()
    expect(within(card).getByText("Physics")).toHaveClass("line-through")
  })

  test("a changed lesson shows what changed", async () => {
    const changed = makeLesson(
      { weekday: 3, period: 3, subject: "physics", room: "r102", subgroup: null },
      { is_overridden: true, changes: { room: [{ name: "204" }, { name: "102" }] } },
    )
    server.use(http.get(apiUrl("/v1/staff/timetable"), () => HttpResponse.json([changed])))
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    expect(await screen.findByText("Room: 204 → 102")).toBeInTheDocument()
  })

  test("phones show one day as a list with a day selector", async () => {
    setViewportWidth(360)
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    const days = await screen.findByRole("group", { name: "Days of the week" })

    expect(within(days).getAllByRole("button")).toHaveLength(7)
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.getAllByText(/Physics/).length).toBeGreaterThan(0)
  })

  test("an empty week says so", async () => {
    server.use(http.get(apiUrl("/v1/staff/timetable"), () => HttpResponse.json([])))
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    expect(await screen.findByText("No lessons this week.")).toBeInTheDocument()
  })
})

describe("week helpers", () => {
  test("a broken ?week= gives this week", () => {
    expect(mondayOf("nonsense")).toBe("2026-10-05")
    expect(mondayOf("2026-10-14")).toBe("2026-10-12")
  })

  test("the selected day is today when it is in the week, else Monday", () => {
    expect(selectedDay("2026-10-05", null)).toBe("2026-10-07")
    expect(selectedDay("2026-10-12", null)).toBe("2026-10-12")
    expect(selectedDay("2026-10-05", "2026-10-09")).toBe("2026-10-09")
  })

  test("periods and cells", () => {
    expect(periodsOf(weekLessons).map((period) => period.period)).toEqual([1, 2, 3, 4, 5, 6])
    expect(lessonsAt(weekLessons, "2026-10-07", 3)).toHaveLength(1)
  })
})
