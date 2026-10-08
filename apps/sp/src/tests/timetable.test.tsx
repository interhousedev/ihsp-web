/** WEB-5, WEB-6, UF-WEB-03, UF-WEB-04: the timetable and the calendar feed. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, calendarTokenResponse, lessonId, makeLesson, server, weekLessons } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { googleCalendarUrl, webcalUrl } from "../features/calendar-feed/utils/feed-links"
import { describeChanges } from "../features/shared/utils/describe-changes"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { lessonsAt, mondayOf, periodsOf, selectedDay, subgroupsOf } from "../features/timetable/utils/week"
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

describe("timetable page", () => {
  test("desktop shows the week as a grid with the periods and bell times", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/" })

    const table = await screen.findByRole("table")

    expect(within(table).getAllByRole("columnheader").length).toBeGreaterThanOrEqual(7)
    expect(within(table).getByText("Period 1")).toBeInTheDocument()
    expect(within(table).getAllByText("Mathematics").length).toBeGreaterThan(0)
  })

  test("a cancelled lesson is marked and struck through", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/" })

    await screen.findByRole("table")
    const cancelled = document.querySelector('[data-cancelled="true"]') as HTMLElement

    expect(cancelled).not.toBeNull()
    expect(within(cancelled).getByText("Cancelled")).toBeInTheDocument()
    expect(within(cancelled).getByText("Chemistry")).toHaveClass("line-through")
  })

  test("a changed lesson shows what changed", async () => {
    const changed = makeLesson(
      { weekday: 3, period: 1, subject: "math", room: "r101", subgroup: null },
      { is_overridden: true, changes: { room: [{ name: "204" }, { name: "310" }] } },
    )
    server.use(http.get(apiUrl("/v1/me/timetable"), () => HttpResponse.json([changed])))
    renderSp(<TimetablePage />, { route: "/timetable/" })

    expect(await screen.findByText("Room: 204 → 310")).toBeInTheDocument()
  })

  test("the current lesson is highlighted", async () => {
    const running = makeLesson({ weekday: 3, period: 1, subject: "math", room: "r101", subgroup: null })
    server.use(
      http.get(apiUrl("/v1/me/timetable"), () =>
        HttpResponse.json([{ ...running, starts_at: "2026-10-07T05:00:00Z", ends_at: "2026-10-07T06:30:00Z" }]),
      ),
    )
    renderSp(<TimetablePage />, { route: "/timetable/" })

    await screen.findByRole("table")

    expect(document.querySelector('[data-current="true"]')).not.toBeNull()
    expect(screen.getByText("Now")).toBeInTheDocument()
  })

  test("the next week button asks for the following Monday to Sunday", async () => {
    const ranges: string[] = []
    server.use(
      http.get(apiUrl("/v1/me/timetable"), ({ request }) => {
        const search = new URL(request.url).searchParams
        ranges.push(`${search.get("from")}..${search.get("to")}`)
        return HttpResponse.json(weekLessons)
      }),
    )
    const { user } = renderSp(<TimetablePage />, { route: "/timetable/" })

    await screen.findByRole("table")
    await user.click(screen.getByRole("button", { name: "Next week" }))

    await waitFor(() => expect(ranges).toEqual(["2026-10-05..2026-10-11", "2026-10-12..2026-10-18"]))
  })

  test("phones show one day as a list with a day selector", async () => {
    setViewportWidth(360)
    const { user } = renderSp(<TimetablePage />, { route: "/timetable/" })

    expect(await screen.findByRole("group", { name: "Days of the week" })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    // Wednesday is today: six lessons.
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(6))
    await user.click(screen.getByRole("button", { name: /^Thursday/ }))

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(3))
  })

  test("a day without lessons says so", async () => {
    setViewportWidth(360)
    const { user } = renderSp(<TimetablePage />, { route: "/timetable/" })

    await screen.findByRole("group", { name: "Days of the week" })
    await user.click(screen.getByRole("button", { name: /^Sunday/ }))

    expect(await screen.findByText("No lessons on this day.")).toBeInTheDocument()
  })

  test("the subgroup hint is shown only when the subgroup is not set", async () => {
    server.use(
      http.get(apiUrl("/v1/me/profile"), () =>
        HttpResponse.json({
          user_id: "u",
          login: null,
          first_name: "A",
          last_name: "B",
          mailbox: null,
          group: { id: "g", name: "2TN2" },
          subgroup: null,
          curator: null,
          head_student: null,
          current_semester: 4,
          emis_status: "active",
          synced_at: null,
        }),
      ),
    )
    renderSp(<TimetablePage />, { route: "/timetable/" })

    expect(await screen.findByText(/subgroup is not set yet/)).toBeInTheDocument()
    expect((await screen.findAllByText("Subgroup 1")).length).toBeGreaterThan(0)
  })
})

describe("subscribe to calendar", () => {
  test("the link is created on demand, shown once and can be regenerated after a confirmation", async () => {
    let created = 0
    server.use(
      http.post(apiUrl("/v1/me/calendar-token"), () => {
        created += 1
        return HttpResponse.json({ url: `${calendarTokenResponse.url}?v=${created}` })
      }),
    )
    const { user } = renderSp(<TimetablePage />, { route: "/timetable/" })

    await user.click(await screen.findByRole("button", { name: "Subscribe to calendar" }))
    expect(created).toBe(0)
    await user.click(await screen.findByRole("button", { name: "Create link" }))

    const field = await screen.findByLabelText("Calendar feed link")
    expect(field).toHaveValue(`${calendarTokenResponse.url}?v=1`)
    expect(screen.getByText("Copy this link now. It is shown only once.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Add to Apple Calendar" }).getAttribute("href")).toStartWith("webcal://")

    await user.click(screen.getByRole("button", { name: "Regenerate link" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(created).toBe(1)
    await user.click(within(dialog).getByRole("button", { name: "Regenerate" }))

    await waitFor(() => expect(created).toBe(2))
    expect(await screen.findByLabelText("Calendar feed link")).toHaveValue(`${calendarTokenResponse.url}?v=2`)
  })

  test("feed links for Apple and Google Calendar", () => {
    expect(webcalUrl("https://api.ihsu.uz/ical/x.ics")).toBe("webcal://api.ihsu.uz/ical/x.ics")
    expect(googleCalendarUrl("https://api.ihsu.uz/ical/x.ics")).toBe(
      "https://calendar.google.com/calendar/r?cid=webcal%3A%2F%2Fapi.ihsu.uz%2Fical%2Fx.ics",
    )
  })
})

describe("week helpers", () => {
  test("mondayOf falls back to this week for a broken value", () => {
    expect(mondayOf("2026-10-08")).toBe("2026-10-05")
    expect(mondayOf("nonsense")).toBe(mondayOf(null))
  })

  test("selectedDay keeps a day inside the week and falls back to today or Monday", () => {
    freezeTime()
    expect(selectedDay("2026-10-05", "2026-10-09")).toBe("2026-10-09")
    expect(selectedDay("2026-10-05", "2026-10-20")).toBe("2026-10-07")
    expect(selectedDay("2026-10-12", null)).toBe("2026-10-12")
    unfreezeTime()
  })

  test("periods come from the lessons of the week and lessons are found by day and period", () => {
    expect(periodsOf(weekLessons).map((period) => period.period)).toEqual([1, 2, 3, 4, 5, 6])
    expect(lessonsAt(weekLessons, "2026-10-07", 3).map((lesson) => lesson.id)).toEqual([lessonId(3, 3)])
  })

  test("subgroups are read from the audience", () => {
    expect(subgroupsOf(makeLesson({ weekday: 1, period: 3, subject: "english", room: "r204", subgroup: 1 }))).toEqual([
      1,
    ])
    expect(subgroupsOf(makeLesson({ weekday: 1, period: 1, subject: "math", room: "r101", subgroup: null }))).toEqual(
      [],
    )
  })

  test("changes are described with readable values", () => {
    expect(
      describeChanges({
        room: [{ name: "204" }, { name: "310" }],
        teacher: [null, { first_name: "A", last_name: "B" }],
      }),
    ).toEqual([
      { field: "room", from: "204", to: "310" },
      { field: "teacher", from: "–", to: "B A" },
    ])
    expect(describeChanges(null)).toEqual([])
  })
})
