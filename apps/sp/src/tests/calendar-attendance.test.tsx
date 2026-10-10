/** The student timetable shows a green or red dot and the mark only for lessons that started before now. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { weekLessons } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { configureTests, freezeTime, renderSp, setViewportWidth, unfreezeTime } from "./helpers"

configureTests()

beforeEach(() => {
  freezeTime()
  setViewportWidth(1280)
})
afterEach(unfreezeTime)

describe("timetable attendance dots", () => {
  test("every shown result belongs to a lesson that started before now", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/" })

    await waitFor(() => expect(screen.getAllByTestId("lesson-result").length).toBeGreaterThan(0))
    const now = Date.now()
    const started = weekLessons.filter((lesson) => Date.parse(lesson.starts_at) < now && lesson.status !== "cancelled")

    expect(screen.getAllByTestId("lesson-result").length).toBeLessThanOrEqual(started.length)
    for (const card of document.querySelectorAll("a[href^='/lessons/view/']")) {
      const id = decodeURIComponent((card.getAttribute("href") ?? "").split("id=")[1] ?? "")
      const lesson = weekLessons.find((item) => item.id === id)
      const hasResult = card.querySelector("[data-testid='lesson-result']") !== null
      if (lesson && Date.parse(lesson.starts_at) >= now) expect(hasResult).toBe(false)
    }
  })

  test("present is a green check; absent and late tint the whole block", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/" })

    await waitFor(() => expect(screen.getAllByRole("img", { name: "Present" }).length).toBeGreaterThan(0))
    expect(screen.getAllByRole("img", { name: "Present" })[0]?.getAttribute("class")).toContain("text-green-600")
    const absent = screen.getAllByRole("img", { name: "Absent" })[0]?.closest("a")
    expect(absent?.getAttribute("data-attendance")).toBe("absent")
    expect(absent?.className).toContain("bg-red-800")
    const late = screen.getAllByRole("img", { name: "Late" })[0]?.closest("a")
    expect(late?.getAttribute("data-attendance")).toBe("late")
    expect(late?.className).toContain("bg-orange-700")
  })
})
