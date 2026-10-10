/** WEB-3, UF-WEB-01, UF-WEB-02: the Today page is only the widget dashboard. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server, studentToday } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TodayPage } from "../features/today/components/today-page"
import { allTodayCards, moveCard, visibleTodayCards } from "../features/today/utils/today-cards"
import { remainingMinutes } from "../features/today/utils/countdown"
import { configureTests, findCard, freezeTime, queryCard, renderSp, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

describe("Today page", () => {
  test("every section is a widget: the page holds nothing outside the dashboard", async () => {
    renderSp(<TodayPage />)

    await findCard("Next lesson")

    const outside = [...document.querySelectorAll("section")].filter(
      (section) => !section.hasAttribute("data-widget-id") && section.getAttribute("aria-labelledby") !== "dashboard-title",
    )
    expect(outside).toHaveLength(0)
    for (const title of ["Today's lessons", "Semester 4", "Announcements", "Needs your attention", "New marks"]) {
      const card = await findCard(title)
      expect(card.closest('[data-testid="dashboard-grid"]')).not.toBeNull()
    }
  })

  test("the next lesson widget counts down", async () => {
    renderSp(<TodayPage />)

    const now = await findCard("Next lesson")

    expect(within(now).getByTestId("next-countdown")).toHaveTextContent("in 8 min")
  })

  test("the semester widget shows the GPA it gets from the API", async () => {
    renderSp(<TodayPage />)

    const semester = await findCard("Semester 4")

    expect(within(semester).getByText("4.10")).toBeInTheDocument()
    expect(within(semester).getByText("GPA (out of 5)")).toBeInTheDocument()
  })

  test("showing new marks records the visit in seen_marks_at", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({})
      }),
    )
    renderSp(<TodayPage />)

    await findCard("New marks")

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ seen_marks_at: expect.any(String) })
  })

  test("with no lesson left it says so", async () => {
    server.use(
      http.get(apiUrl("/v1/me/today"), () =>
        HttpResponse.json({
          ...studentToday,
          now_or_next: null,
          lessons: [],
          next_study_day: "2026-10-08",
          due: [],
          new_marks: [],
          semester: { semester: 4, gpa: null, gpa_change: null, absences: 0 },
          synced_at: null,
        }),
      ),
    )
    renderSp(<TodayPage />)

    expect(await screen.findAllByText("Nothing up next.")).not.toHaveLength(0)
    expect(await screen.findByText("Importing your marks from EMIS…")).toBeInTheDocument()
    expect(queryCard("Needs your attention")).not.toBeNull()
  })
})

describe("Today card helpers", () => {
  test("unknown ids and duplicates are dropped from the saved cards", () => {
    expect(visibleTodayCards(["due", "bogus", "now", "due"])).toEqual(["due", "now"])
  })

  test("the editor lists visible cards first and hidden ones after", () => {
    const cards = allTodayCards(["marks", "now"])

    expect(cards.slice(0, 2)).toEqual([
      { id: "marks", visible: true },
      { id: "now", visible: true },
    ])
    expect(cards.slice(2).every((card) => !card.visible)).toBe(true)
    expect(cards).toHaveLength(7)
  })

  test("moving a card swaps it with its neighbour and stops at the ends", () => {
    expect(moveCard(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"])
    expect(moveCard(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"])
    expect(moveCard(["a", "b", "c"], 2, 1)).toEqual(["a", "b", "c"])
  })

  test("the countdown keeps running between refetches and never goes below zero", () => {
    const loadedAt = 1_000_000
    expect(remainingMinutes(8, loadedAt, loadedAt + 3 * 60_000 + 5_000)).toBe(5)
    expect(remainingMinutes(8, loadedAt, loadedAt + 30 * 60_000)).toBe(0)
  })
})
