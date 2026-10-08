/** WEB-3, UF-WEB-01, UF-WEB-02: the Today dashboard. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TodayPage } from "../features/today/components/today-page"
import { allTodayCards, moveCard, visibleTodayCards } from "../features/today/utils/today-cards"
import { remainingMinutes } from "../features/today/utils/countdown"
import { configureTests, findCard, freezeTime, queryCard, renderSp, studentWith, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

describe("Today page", () => {
  test("shows every card from the fixtures", async () => {
    renderSp(<TodayPage />)

    const now = await findCard("Next lesson")
    expect(within(now).getByText("in 8 min")).toBeInTheDocument()
    expect(within(now).getByText(/2 materials/)).toBeInTheDocument()
    for (const title of [
      "Today's lessons",
      /^Due /,
      "New marks",
      "Semester 4",
      "Announcements",
      "Needs your attention",
    ]) {
      await findCard(title)
    }
  })

  test("the semester card shows the GPA, its change and the absences", async () => {
    renderSp(<TodayPage />)

    const semester = await findCard("Semester 4")

    expect(within(semester).getByText("4.10")).toBeInTheDocument()
    expect(within(semester).getByText("+0.20 vs last semester")).toBeInTheDocument()
    expect(within(semester).getByText("5")).toBeInTheDocument()
  })

  test("alerts say what to do and link to the fix", async () => {
    renderSp(<TodayPage />)

    const alerts = await findCard("Needs your attention")

    expect(within(alerts).getByText(/2 files will be deleted on/)).toBeInTheDocument()
    expect(within(alerts).getByText(/1 assistant action is waiting/)).toBeInTheDocument()
    expect(within(alerts).getByRole("link", { name: "Open My files" }).getAttribute("href")).toMatch(/^\/files\/?$/)
  })

  test("cards removed in the preferences are hidden", async () => {
    renderSp(<TodayPage />, { session: studentWith({ today_cards: ["now", "due"] }) })

    await findCard("Next lesson")

    expect(queryCard(/^Due /)).not.toBeNull()
    expect(queryCard("Today's lessons")).toBeNull()
    expect(queryCard("New marks")).toBeNull()
    expect(queryCard("Semester 4")).toBeNull()
  })

  test("cards follow the order of the preferences", async () => {
    renderSp(<TodayPage />, { session: studentWith({ today_cards: ["due", "now"] }) })

    const now = await findCard("Next lesson")
    const due = await findCard(/^Due /)

    expect(due.compareDocumentPosition(now) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test("showing new marks records the visit in seen_marks_at", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({})
      }),
    )
    renderSp(<TodayPage />, { session: studentWith({ today_cards: ["marks"] }) })

    await findCard("New marks")

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ seen_marks_at: expect.any(String) })
  })

  test("with no lesson left it says so and names the next study day", async () => {
    server.use(
      http.get(apiUrl("/v1/me/today"), () =>
        HttpResponse.json({
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
    renderSp(<TodayPage />, { session: studentWith({ today_cards: ["now", "semester"] }) })

    expect(await screen.findByText("No more lessons today.")).toBeInTheDocument()
    expect(screen.getByText(/Next study day: /)).toBeInTheDocument()
    expect(screen.getByText("Importing your marks from EMIS…")).toBeInTheDocument()
  })

  test("the Get started card can be dismissed step by step", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ onboarding_dismissed: ["notifications"], today_cards: [] })
      }),
    )
    const { user } = renderSp(<TodayPage />, { session: studentWith({ today_cards: [] }) })

    const card = await findCard("Get started")
    expect(within(card).getByText("Choose notifications")).toBeInTheDocument()
    await user.click(within(card).getByRole("button", { name: "Skip: Choose notifications" }))

    await waitFor(() => expect(bodies).toEqual([{ onboarding_dismissed: ["notifications"] }]))
    await waitFor(() => expect(queryCard("Get started")).toBeNull())
  })

  test("a failed request shows the error state with a retry button", async () => {
    server.use(
      http.get(apiUrl("/v1/me/today"), () =>
        HttpResponse.json({ type: "common/internal", title: "x", status: 500 }, { status: 500 }),
      ),
    )
    renderSp(<TodayPage />)

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
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
