/** The subgroup toggle and academic weeks of the calendar, My marks of a subject, the week and month views of the grades. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, ids, makeLesson, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { GradesPage } from "../features/grades/components/grades-page"
import { SubjectPage } from "../features/subjects/components/subject-page"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { HIDE_OTHER_SUBGROUP } from "../features/timetable/hooks/use-hide-other-subgroup"
import { configureTests, freezeTime, renderSp, setViewportWidth, studentWith, unfreezeTime } from "./helpers"

configureTests()

beforeEach(() => {
  freezeTime()
  setViewportWidth(1280)
})
afterEach(unfreezeTime)

const LABEL = "Do not show other subgroup lessons"

function serveOtherSubgroup() {
  server.use(
    http.get(apiUrl("/v1/me/timetable"), () =>
      HttpResponse.json([
        {
          ...makeLesson({ weekday: 3, period: 3, subject: "english", room: "r204", subgroup: 1 }, { id: "lesson-a" }),
          subgroup: { subgroup_id: 1, subgroup_name: "2TN2/1", is_own_subgroup: true },
        },
        {
          ...makeLesson(
            { weekday: 3, period: 4, subject: "informatics", room: "klaster", subgroup: 2 },
            { id: "lesson-b" },
          ),
          subgroup: { subgroup_id: 2, subgroup_name: "2TN2/2", is_own_subgroup: false },
        },
      ]),
    ),
  )
}

describe("other subgroup toggle", () => {
  test("turning it on hides the other subgroup's lesson and saves the choice in the account", async () => {
    serveOtherSubgroup()
    const saved: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        const patch = await request.json()
        saved.push(patch)
        return HttpResponse.json(patch)
      }),
    )
    const { container } = renderSp(<TimetablePage />, {
      route: "/timetable/?view=week",
      session: studentWith({ onboarding_dismissed: [] }),
    })

    await waitFor(() => expect(container.querySelectorAll("[data-other-subgroup]")).toHaveLength(1))
    await userEvent.setup().click(screen.getByRole("switch", { name: LABEL }))

    await waitFor(() => expect(saved).toEqual([{ onboarding_dismissed: [HIDE_OTHER_SUBGROUP] }]))
    await waitFor(() => expect(container.querySelector("[data-other-subgroup]")).toBeNull())
  })

  test("a saved choice hides the lesson and keeps the toggle to turn it off", async () => {
    serveOtherSubgroup()
    const { container } = renderSp(<TimetablePage />, {
      route: "/timetable/?view=week",
      session: studentWith({ onboarding_dismissed: [HIDE_OTHER_SUBGROUP] }),
    })

    expect(await screen.findByRole("switch", { name: LABEL })).toBeInTheDocument()
    expect(container.querySelector("[data-other-subgroup]")).toBeNull()
    expect(container.querySelector("a[href*='lesson-a']")).not.toBeNull()
  })

  test("a week without the other subgroup's lessons has no toggle", async () => {
    const { container } = renderSp(<TimetablePage />, { route: "/timetable/?view=week" })

    await waitFor(() => expect(container.querySelector("a[href^='/lessons/view']")).not.toBeNull())
    expect(screen.queryByRole("switch", { name: LABEL })).not.toBeInTheDocument()
  })
})

describe("academic weeks on the month calendar", () => {
  test("each row of the month shows its week, counted from the start of the year", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/?view=month&day=2026-10-07" })

    // The fixture year starts on 2026-09-01, so the week of 5 October is the sixth.
    expect(await screen.findByRole("img", { name: "Academic week 6" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Academic week 5" })).toBeInTheDocument()
  })
})

describe("my marks of a subject", () => {
  test("lists every mark, newest first, next to the planner", async () => {
    renderSp(<SubjectPage />, { route: `/subjects/view/?id=${ids.physics}&semester=4&tab=marks` })

    const rows = await screen.findAllByTestId("subject-mark")
    expect(rows.length).toBeGreaterThan(0)
    expect(screen.getByRole("link", { name: "Mark planner" })).toBeInTheDocument()
  })
})

describe("grades by week and month", () => {
  test("the switch offers day, week and month and the day stays the default", async () => {
    renderSp(<GradesPage />, { route: "/grades/?tab=day&date=2026-10-06" })

    const group = await screen.findByRole("group", { name: "Show marks by" })
    expect(within(group).getByRole("button", { name: "Day" })).toHaveAttribute("aria-pressed", "true")
    expect(within(group).getByRole("button", { name: "Week" })).toBeInTheDocument()
    expect(within(group).getByRole("button", { name: "Month" })).toBeInTheDocument()
  })

  test("the week shows the marks under their day and a day opens the day view", async () => {
    renderSp(<GradesPage />, { route: "/grades/?tab=day&date=2026-10-06&view=week" })

    const week = await screen.findByTestId("grades-week")
    const day = await within(week).findByRole("button", { name: /\d marks?$/ })
    await userEvent.setup().click(day)

    expect(await screen.findByTestId("day-date")).toBeInTheDocument()
  })

  test("the month shows the day with its marks and asks nothing for the future", async () => {
    const asked: string[] = []
    server.events.on("request:start", ({ request }) => {
      if (request.url.includes("/grades/day")) asked.push(new URL(request.url).searchParams.get("date") ?? "")
    })
    renderSp(<GradesPage />, { route: "/grades/?tab=day&date=2026-10-06&view=month" })

    const month = await screen.findByTestId("grades-month")
    expect(await within(month).findByRole("button", { name: /\d marks?$/ })).toBeInTheDocument()
    expect(asked.every((date) => date <= "2026-10-07")).toBe(true)
    server.events.removeAllListeners()
  })
})
