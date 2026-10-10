/** WEB-12–16, UF-WEB-09–11: grades, by day, record book. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, semesterGrades, server, userMe } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { GradesPage } from "../features/grades/components/grades-page"
import { shiftStudyDay } from "../features/grades/utils/study-days"
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

describe("semester grades", () => {
  test("the table shows the GPA, averages, semester mark and EMIS rating of every subject", async () => {
    renderSp(<GradesPage />, { route: "/grades/" })

    expect(await screen.findByRole("table")).toBeInTheDocument()
    expect(screen.getByText("4.10")).toBeInTheDocument()
    expect(screen.getByText("GPA (out of 5)")).toBeInTheDocument()
    const rows = screen.getAllByRole("row")
    expect(rows).toHaveLength(semesterGrades.rows.length + 1)
    const physics = within(rows.find((row) => within(row).queryByText("Physics")) as HTMLElement)
    expect(physics.getByText("4.8")).toBeInTheDocument()
    expect(screen.getByText(/Updated /)).toBeInTheDocument()
  })

  test("below 768 px the table becomes cards", async () => {
    setViewportWidth(360)
    renderSp(<GradesPage />, { route: "/grades/" })

    expect(await screen.findAllByTestId("grade-card")).toHaveLength(semesterGrades.rows.length)
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  test("a subject row opens the Marks tab of the subject", async () => {
    renderSp(<GradesPage />, { route: "/grades/" })

    const link = await screen.findByRole("link", { name: "Physics" })

    expect(link.getAttribute("href")).toMatch(/^\/subjects\/view\/?\?id=.+&tab=marks&semester=4$/)
  })

  test("a banner leads to the EMIS password page when it needs updating", async () => {
    renderSp(<GradesPage />, { route: "/grades/", session: { user: { ...userMe, emis_status: "needs_reauth" } } })

    expect(await screen.findByText("EMIS password needs updating")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Update password" }).getAttribute("href")).toBe(
      "http://localhost:3001/security/emis/",
    )
  })

  test("before the first sync it says the marks are being imported", async () => {
    server.use(
      http.get(apiUrl("/v1/me/grades"), () => HttpResponse.json({ semester: 4, gpa: null, synced_at: null, rows: [] })),
    )
    renderSp(<GradesPage />, { route: "/grades/" })

    expect(await screen.findByText("Importing your marks from EMIS…")).toBeInTheDocument()
  })
})

describe("grades by day", () => {
  test("marks sit on their lessons and marks without a lesson are listed apart", async () => {
    renderSp(<GradesPage />, { route: "/grades/?tab=day&date=2026-10-06" })

    expect(await screen.findByText("Marks without a lesson")).toBeInTheDocument()
    expect(screen.getByText("Mathematics")).toBeInTheDocument()
    expect(screen.getByText(/History/)).toBeInTheDocument()
  })

  test("the date is a compact fixed-width box that does not stretch across the row", async () => {
    renderSp(<GradesPage />, { route: "/grades/?tab=day&date=2026-10-06" })

    const box = await screen.findByTestId("day-date")
    expect(box.className).toContain("w-44")
    expect(box.className).toContain("shrink-0")
    expect(within(box).getByRole("button", { name: "Pick a date" }).className).toContain("w-full")
  })

  test("a day without marks shows the empty state", async () => {
    server.use(
      http.get(apiUrl("/v1/me/grades/day"), () =>
        HttpResponse.json({ date: "2026-10-04", lessons: [], unmatched: [] }),
      ),
    )
    renderSp(<GradesPage />, { route: "/grades/?tab=day&date=2026-10-04" })

    expect(await screen.findByText("No marks on this day.")).toBeInTheDocument()
  })

  test("the arrows skip Saturdays and Sundays", () => {
    expect(shiftStudyDay("2026-10-05", -1)).toBe("2026-10-02")
    expect(shiftStudyDay("2026-10-02", 1)).toBe("2026-10-05")
    expect(shiftStudyDay("2026-10-06", 1)).toBe("2026-10-07")
    expect(shiftStudyDay("2026-10-10", -1)).toBe("2026-10-09")
    expect(shiftStudyDay("2026-10-10", 1)).toBe("2026-10-12")
  })
})

describe("record book", () => {
  test("shows the GPA of all four semesters and their subjects", async () => {
    renderSp(<GradesPage />, { route: "/grades/?tab=record" })

    const gpas = await screen.findAllByTestId("record-semester-gpa")

    expect(gpas).toHaveLength(4)
    expect(gpas.map((item) => item.textContent)).toEqual([
      expect.stringContaining("3.90"),
      expect.stringContaining("4.00"),
      expect.stringContaining("3.90"),
      expect.stringContaining("4.10"),
    ])
    expect(screen.getByRole("img", { name: "Line chart of GPA by semester" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4)
  })
})
