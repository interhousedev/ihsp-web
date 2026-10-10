/** WEB-17, UF-WEB-12: the student's own attendance. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server, studentAttendance } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { AttendancePage } from "../features/attendance/components/attendance-page"
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

describe("attendance page", () => {
  test("says how many lessons have no attendance taken yet", async () => {
    renderSp(<AttendancePage />, { route: "/attendance/" })

    expect(await screen.findByTestId("not-taken")).toHaveTextContent(
      "1 lesson has no attendance taken yet and is not counted.",
    )
  })

  test("the summary lists absences, excused, lessons and the rate of each subject", async () => {
    renderSp(<AttendancePage />, { route: "/attendance/" })

    const table = await screen.findByRole("table")
    const rows = within(table).getAllByRole("row")

    expect(rows).toHaveLength(studentAttendance.summary.length + 1)
    const math = within(rows.find((row) => within(row).queryByText("Mathematics")) as HTMLElement)
    expect(math.getByText("14%")).toBeInTheDocument()
  })

  test("on a phone the summary is a list of cards", async () => {
    setViewportWidth(360)
    renderSp(<AttendancePage />, { route: "/attendance/" })

    await screen.findByText("Summary by subject")

    expect(await screen.findAllByText(/Absences: \d/)).toHaveLength(studentAttendance.summary.length)
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  test("lists every missed lesson, newest first, with excused ones marked", async () => {
    renderSp(<AttendancePage />, { route: "/attendance/" })

    const list = await screen.findByRole("heading", { name: "Missed lessons" })
    const items = within(list.parentElement as HTMLElement).getAllByRole("link")

    expect(items).toHaveLength(studentAttendance.missed.length)
    expect(within(items[0] as HTMLElement).getByText("Chemistry")).toBeInTheDocument()
    expect(screen.getAllByText("Excused")).not.toHaveLength(0)
  })

  test("tapping a day of the calendar shows only its missed lessons", async () => {
    const { user } = renderSp(<AttendancePage />, { route: "/attendance/" })

    await screen.findByText("Missed lessons")
    await user.click(await screen.findByRole("button", { name: /^6 October: 1 absence$/ }))

    expect(await screen.findByRole("heading", { name: "Missed on 6 October" })).toBeInTheDocument()
    expect(screen.getAllByRole("link")).toHaveLength(1)
  })

  test("a period choice asks for that period", async () => {
    const requests: string[] = []
    server.use(
      http.get(apiUrl("/v1/me/attendance"), ({ request }) => {
        requests.push(new URL(request.url).search)
        return HttpResponse.json(studentAttendance)
      }),
    )
    const { user } = renderSp(<AttendancePage />, { route: "/attendance/" })

    await screen.findByText("Missed lessons")
    await user.click(screen.getByRole("button", { name: "Last 30 days" }))

    await waitFor(() => expect(requests.at(-1)).toBe("?from=2026-09-08&to=2026-10-07"))
    expect(requests[0]).toBe("")
  })

  test("a period without absences shows the friendly message", async () => {
    server.use(
      http.get(apiUrl("/v1/me/attendance"), () =>
        HttpResponse.json({ from: "2026-09-02", to: "2026-10-07", summary: [], days: [], missed: [], not_taken: 0 }),
      ),
    )
    renderSp(<AttendancePage />, { route: "/attendance/" })

    expect(await screen.findByText("No missed lessons.")).toBeInTheDocument()
    expect(screen.queryByTestId("not-taken")).not.toBeInTheDocument()
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

  test("the calendar opens on the current month when the period ends in the future", async () => {
    server.use(
      http.get(apiUrl("/v1/me/attendance"), () =>
        HttpResponse.json({ from: "2026-09-02", to: "2026-12-20", summary: [], days: [], missed: [], not_taken: 0 }),
      ),
    )
    renderSp(<AttendancePage />, { route: "/attendance/" })

    expect(await screen.findByText("October 2026")).toBeInTheDocument()
    expect(screen.queryByText("December 2026")).not.toBeInTheDocument()
  })
})
