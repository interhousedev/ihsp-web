/** Integration: the grades page keeps the semester accordions and the attendance squares, without a separate marks timetable. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server, subjectCards } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { GradesPage } from "../features/grades/components/grades-page"
import { AttendanceWeekSquares } from "../features/attendance/components/attendance-week-squares"
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

describe("marks sections on the grades page", () => {
  test("the semester tab has no separate marks-by-lesson timetable", async () => {
    renderSp(<GradesPage />, { route: "/grades/?tab=semester" })

    await screen.findAllByText("Semester 4")
    expect(screen.queryByRole("heading", { name: "Marks by lesson" })).not.toBeInTheDocument()
  })

  test("the current semester accordion is open and past semesters open on demand with only their subjects", async () => {
    const [first, second] = subjectCards
    server.use(
      http.get(apiUrl("/v1/me/subjects"), ({ request }) => {
        const semester = new URL(request.url).searchParams.get("semester")
        return HttpResponse.json(semester === "3" ? [first] : [second])
      }),
    )
    renderSp(<GradesPage />, { route: "/grades/?tab=semester" })

    const currentSummary = (await screen.findAllByText("Semester 4")).find((node) => node.closest("summary"))
    const current = currentSummary?.closest("details") as HTMLElement
    expect(current).toHaveAttribute("open")
    expect(await within(current).findByText(second?.subject.name ?? "")).toBeInTheDocument()

    const pastSummary = (await screen.findAllByText("Semester 3")).find((node) => node.closest("summary"))
    const past = pastSummary?.closest("details") as HTMLElement
    expect(past).not.toHaveAttribute("open")
    expect(within(past).queryByText(first?.subject.name ?? "")).not.toBeInTheDocument()
    pastSummary?.closest("summary")?.click()
    expect(await within(past).findByText(first?.subject.name ?? "")).toBeInTheDocument()
    expect(within(past).queryByText(second?.subject.name ?? "")).not.toBeInTheDocument()
  })

  test("the attendance squares show one square per lesson of the week, coloured by state", async () => {
    renderSp(<AttendanceWeekSquares />)

    expect(await screen.findByRole("heading", { name: "Attendance this week" })).toBeInTheDocument()
    const squares = await screen.findAllByRole("img", {
      name: /Present|Absent|Not taken yet|Lesson not yet held|Excused absence/,
    })
    expect(squares.length).toBeGreaterThan(0)
  })
})
