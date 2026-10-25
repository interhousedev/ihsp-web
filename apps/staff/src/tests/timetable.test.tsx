/** STF-3, UF-STF-03: the timetable with warnings. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, makeLesson, server, weekLessons } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { lessonsAt, mondayOf, periodsOf, selectedDay, weekDays, weekRange } from "../features/timetable/utils/week"
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

    expect(within(table).getByText("Period 1")).toBeInTheDocument()
    expect(within(table).getAllByText("Physics").length).toBeGreaterThan(0)
  })

  test("the week grid has exactly five day columns, Monday to Friday", async () => {
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    const table = await screen.findByRole("table")
    // The first column header is the empty corner cell above the periods.
    const [, ...dayHeaders] = within(table).getAllByRole("columnheader")

    expect(dayHeaders.map((header) => header.textContent)).toEqual([
      "Mon5 Oct",
      "Tue6 Oct",
      "Wed7 Oct",
      "Thu8 Oct",
      "Fri9 Oct",
    ])
    expect(within(table).queryByText(/^(Sat|Sun)/)).not.toBeInTheDocument()
  })

  test("the timetable is requested for Monday to Friday only", async () => {
    let requested: URL | null = null
    server.use(
      http.get(apiUrl("/v1/staff/timetable"), ({ request }) => {
        requested = new URL(request.url)
        return HttpResponse.json(weekLessons)
      }),
    )
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    await screen.findByRole("table")

    expect(requested).not.toBeNull()
    expect((requested as unknown as URL).searchParams.get("from")).toBe("2026-10-05")
    expect((requested as unknown as URL).searchParams.get("to")).toBe("2026-10-09")
  })

  test("the week label ends on Friday", async () => {
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    expect(await screen.findByText("5 Oct – 9 Oct")).toBeInTheDocument()
  })

  test("lessons dated on a Saturday or Sunday are not drawn", async () => {
    const monday = makeLesson({ weekday: 1, period: 1, subject: "math", room: "r101", subgroup: null })
    const saturday = makeLesson(
      { weekday: 1, period: 6, subject: "physics", room: "r102", subgroup: null },
      { id: "00000000-0000-4000-8000-0000000005a7", date: "2026-10-10" },
    )
    const sunday = makeLesson(
      { weekday: 1, period: 6, subject: "physics", room: "r102", subgroup: null },
      { id: "00000000-0000-4000-8000-0000000005a8", date: "2026-10-11" },
    )
    server.use(http.get(apiUrl("/v1/staff/timetable"), () => HttpResponse.json([monday, saturday, sunday])))
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    const table = await screen.findByRole("table")

    expect(within(table).getAllByText("Mathematics")).toHaveLength(1)
    expect(within(table).queryByText("Physics")).not.toBeInTheDocument()
    // The period that only the weekend lessons use gets no empty row, and there is still no weekend column.
    expect(within(table).queryByText("Period 6")).not.toBeInTheDocument()
    expect(within(table).getAllByRole("columnheader")).toHaveLength(6)
  })

  test("a week with lessons only on Saturday shows an empty grid, not an error", async () => {
    const saturday = makeLesson(
      { weekday: 1, period: 2, subject: "physics", room: "r102", subgroup: null },
      { id: "00000000-0000-4000-8000-0000000005a9", date: "2026-10-10" },
    )
    server.use(http.get(apiUrl("/v1/staff/timetable"), () => HttpResponse.json([saturday])))
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    const table = await screen.findByRole("table")

    expect(within(table).queryByText("Physics")).not.toBeInTheDocument()
    expect(within(table).queryByText(/Period \d/)).not.toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
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

  test("a past lesson with attendance shows a green marker with the absent count; a future one shows nothing", async () => {
    const taken = makeLesson(
      { weekday: 1, period: 2, subject: "physics", room: "r102", subgroup: null },
      { attendance_submitted: true, absent_count: 3 },
    )
    const future = makeLesson(
      { weekday: 5, period: 4, subject: "physics", room: "r102", subgroup: null },
      { attendance_submitted: false },
    )
    server.use(http.get(apiUrl("/v1/staff/timetable"), () => HttpResponse.json([taken, future])))
    renderStaff(<TimetablePage />, { route: "/timetable/" })

    const table = await screen.findByRole("table")

    const markers = within(table).getAllByTestId("attendance-taken")
    expect(markers).toHaveLength(1)
    expect(markers[0]).toHaveTextContent("Taken · 3 absent")
    expect(within(table).queryByText("Attendance missing")).not.toBeInTheDocument()
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

    const buttons = within(days).getAllByRole("button")

    expect(buttons).toHaveLength(5)
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Monday 5 October",
      "Tuesday 6 October",
      "Wednesday 7 October",
      "Thursday 8 October",
      "Friday 9 October",
    ])
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

  test("the school week is Monday to Friday", () => {
    expect(weekDays("2026-10-05")).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"])
    expect(weekRange("2026-10-05")).toEqual({ from: "2026-10-05", to: "2026-10-09" })
  })

  test("a ?day= on the weekend is ignored: today (if in the week) or Monday", () => {
    expect(selectedDay("2026-10-05", "2026-10-10")).toBe("2026-10-07")
    expect(selectedDay("2026-10-05", "2026-10-11")).toBe("2026-10-07")
    expect(selectedDay("2026-10-12", "2026-10-17")).toBe("2026-10-12")
  })

  test("periods and cells", () => {
    expect(periodsOf(weekLessons).map((period) => period.period)).toEqual([1, 2, 3, 4, 5, 6])
    expect(lessonsAt(weekLessons, "2026-10-07", 3)).toHaveLength(1)
  })
})
