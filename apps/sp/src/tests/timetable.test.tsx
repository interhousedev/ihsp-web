/** WEB-5, WEB-6, UF-WEB-03, UF-WEB-04: the calendar (day, week, month) and the calendar feed. */
import { afterEach, beforeEach, describe, expect, setSystemTime, test } from "bun:test"
import { apiUrl, calendarTokenResponse, lessonId, makeLesson, server, weekLessons } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { googleCalendarUrl, webcalUrl } from "../features/calendar-feed/utils/feed-links"
import { describeChanges } from "../features/shared/utils/describe-changes"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { isIsoDate, isWeekend, lessonsOn, subgroupsOf, weekDays, weekRange } from "../features/timetable/utils/week"
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

/** The block of a lesson on the grid (a link to the lesson page; the href may come without the trailing slash). */
function blockOf(id: string): HTMLElement {
  const block = document.querySelector(`a[href*="/lessons/view"][href*="${encodeURIComponent(id)}"]`)
  if (!block) throw new Error(`no block for ${id}`)
  return block as HTMLElement
}

/** The lesson slots of the day or week columns (other lists on the page belong to the attendance overview). */
function lessonSlots(): Element[] {
  return Array.from(document.querySelectorAll("ol[aria-label] > li"))
}

/** The positioned slot (`li`) of a block: its top and height are the minutes times the scale. */
function slotOf(id: string): HTMLElement {
  return blockOf(id).closest("li") as HTMLElement
}

describe("calendar week view", () => {
  test("the week is a time axis with the hours, and every lesson block is in the grid", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/" })

    expect(await screen.findByText("08:00")).toBeInTheDocument()
    expect(screen.getByText("14:00")).toBeInTheDocument()
    // The fixture has two Saturday lessons; the study week has no Saturday column, so they are not drawn.
    const studyLessons = weekLessons.filter((lesson) => !isWeekend(lesson.date))
    expect(document.querySelectorAll("a[href*='/lessons/view']")).toHaveLength(studyLessons.length)
    expect(screen.getAllByText("Mathematics").length).toBeGreaterThan(0)
  })

  test("the study week has five columns, Monday to Friday, and no weekend column", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/" })

    await screen.findByText("08:00")
    const columns = Array.from(document.querySelectorAll("ol[aria-label]")).map((column) =>
      column.getAttribute("aria-label"),
    )
    expect(columns).toHaveLength(5)
    expect(columns.map((label) => label?.slice(0, 3))).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"])
  })

  test("a block is placed by its start and its length, proportional to the minutes", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/" })

    await screen.findByText("08:00")
    // Monday period 1: 08:30–09:15 is 30 minutes after 08:00 and 45 minutes long; the desktop scale is 1.2 px a minute.
    const slot = slotOf(lessonId(1, 1))
    expect(slot.style.top).toBe("36px")
    expect(slot.style.height).toBe("54px")
  })

  test("a break between two lessons is labelled, a cancelled lesson is struck through", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/" })

    expect((await screen.findAllByText("Break: 10 min")).length).toBeGreaterThan(0)
    const cancelled = document.querySelector('[data-cancelled="true"]') as HTMLElement

    expect(cancelled).not.toBeNull()
    expect(within(cancelled).getByText("Cancelled")).toBeInTheDocument()
    expect(within(cancelled).getByText("Chemistry")).toHaveClass("line-through")
  })

  test("two lessons at the same time sit side by side", async () => {
    server.use(
      http.get(apiUrl("/v1/me/timetable"), () =>
        HttpResponse.json([
          makeLesson({ weekday: 3, period: 3, subject: "english", room: "r204", subgroup: 1 }, { id: "lesson-a" }),
          makeLesson(
            { weekday: 3, period: 3, subject: "informatics", room: "klaster", subgroup: 2 },
            { id: "lesson-b" },
          ),
        ]),
      ),
    )
    renderSp(<TimetablePage />, { route: "/timetable/" })

    // The two lessons start at 10:20, so the axis starts at 10:00.
    await screen.findByText("10:00")
    expect(slotOf("lesson-a").style.width).toBe("50%")
    expect(slotOf("lesson-a").style.left).toBe("0%")
    expect(slotOf("lesson-b").style.left).toBe("50%")
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

    await waitFor(() => expect(document.querySelector('[data-current="true"]')).not.toBeNull())

    expect(document.querySelector('[data-current="true"]')).not.toBeNull()
    expect(screen.getByText("Now")).toBeInTheDocument()
  })

  test("on a Saturday the calendar opens on the coming week", async () => {
    // Saturday 10 October 2026, 10:12 in Tashkent.
    setSystemTime(new Date("2026-10-10T05:12:00Z"))
    const ranges: string[] = []
    server.use(
      http.get(apiUrl("/v1/me/timetable"), ({ request }) => {
        const search = new URL(request.url).searchParams
        ranges.push(`${search.get("from")}..${search.get("to")}`)
        return HttpResponse.json(weekLessons)
      }),
    )
    renderSp(<TimetablePage />, { route: "/timetable/" })

    await waitFor(() => expect(ranges).toContain("2026-10-12..2026-10-16"))
    expect(ranges).not.toContain("2026-10-05..2026-10-09")
  })

  test("the next week button asks for the following Monday to Friday", async () => {
    const ranges: string[] = []
    server.use(
      http.get(apiUrl("/v1/me/timetable"), ({ request }) => {
        const search = new URL(request.url).searchParams
        ranges.push(`${search.get("from")}..${search.get("to")}`)
        return HttpResponse.json(weekLessons)
      }),
    )
    const { user } = renderSp(<TimetablePage />, { route: "/timetable/" })

    await screen.findByText("08:00")
    await user.click(screen.getByRole("button", { name: "Next week" }))

    await waitFor(() => expect(ranges).toContain("2026-10-12..2026-10-16"))
    expect(ranges).toContain("2026-10-05..2026-10-09")
  })

  test("the address picks the view and the day", async () => {
    renderSp(<TimetablePage />, { route: "/timetable/?view=day&day=2026-10-06" })

    expect(await screen.findByRole("button", { name: /^Tuesday/ })).toHaveAttribute("aria-pressed", "true")
    // A day view has one column of lessons; the week view has five.
    expect(document.querySelectorAll("ol[aria-label]")).toHaveLength(1)
  })

  test("the study week has five days, Monday to Friday", () => {
    expect(weekDays("2026-10-05")).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"])
  })
})

describe("calendar day view on a phone", () => {
  test("the day is a time axis with the lessons at their minutes and the now line", async () => {
    setViewportWidth(360)
    renderSp(<TimetablePage />, { route: "/timetable/" })

    expect(await screen.findByRole("group", { name: "Days of the week" })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    // Wednesday is today: six lessons, the axis from 08:00, the now line at 10:12 (132 minutes at 1.5 px).
    await waitFor(() => expect(lessonSlots()).toHaveLength(6))
    expect(screen.getByText("08:00")).toBeInTheDocument()
    expect((document.querySelector("[data-now]") as HTMLElement).style.top).toBe("198px")
    expect(slotOf(lessonId(3, 1)).style.top).toBe("45px")
    expect(slotOf(lessonId(3, 1)).style.height).toBe("67.5px")
  })

  test("a free gap of 30 minutes or more is labelled and the empty time is left empty", async () => {
    setViewportWidth(360)
    server.use(
      http.get(apiUrl("/v1/me/timetable"), () =>
        HttpResponse.json([
          makeLesson({ weekday: 3, period: 1, subject: "math", room: "r101", subgroup: null }),
          makeLesson({ weekday: 3, period: 4, subject: "history", room: "r101", subgroup: null }),
        ]),
      ),
    )
    renderSp(<TimetablePage />, { route: "/timetable/" })

    // 09:15 to 11:25 is 130 minutes of free time.
    expect(await screen.findByText("Free: 130 min")).toBeInTheDocument()
    expect(document.querySelector('[data-gap="free"]')).not.toBeNull()
    expect(lessonSlots()).toHaveLength(2)
  })

  test("the day changes with the buttons, the week strip and a swipe", async () => {
    setViewportWidth(360)
    const { user } = renderSp(<TimetablePage />, { route: "/timetable/" })

    await waitFor(() => expect(lessonSlots()).toHaveLength(6))
    await user.click(screen.getByRole("button", { name: "Next day" }))
    await waitFor(() => expect(lessonSlots()).toHaveLength(3))
    expect(screen.getByRole("button", { name: /^Thursday/ })).toHaveAttribute("aria-pressed", "true")

    const day = screen.getByRole("list", { name: /^Thursday/ })
    fireEvent.touchStart(day, { touches: [{ clientX: 260, clientY: 300 }] })
    fireEvent.touchEnd(day, { changedTouches: [{ clientX: 120, clientY: 306 }] })
    await waitFor(() => expect(screen.getByRole("button", { name: /^Friday/ })).toHaveAttribute("aria-pressed", "true"))
  })

  test("the week strip has the five study days and no weekend", async () => {
    setViewportWidth(360)
    renderSp(<TimetablePage />, { route: "/timetable/" })

    const strip = await screen.findByRole("group", { name: "Days of the week" })
    expect(within(strip).getAllByRole("button")).toHaveLength(5)
    expect(within(strip).queryByRole("button", { name: /^Saturday/ })).toBeNull()
  })

  test("the day steps over the weekend: next from Friday is Monday, previous from Monday is Friday", async () => {
    setViewportWidth(360)
    const { user } = renderSp(<TimetablePage />, { route: "/timetable/?view=day&day=2026-10-09" })

    expect(await screen.findByRole("button", { name: /^Friday/ })).toHaveAttribute("aria-pressed", "true")
    await user.click(screen.getByRole("button", { name: "Next day" }))
    expect(await screen.findByRole("button", { name: /^Monday/ })).toHaveAttribute("aria-pressed", "true")
    await user.click(screen.getByRole("button", { name: "Previous day" }))
    expect(await screen.findByRole("button", { name: /^Friday/ })).toHaveAttribute("aria-pressed", "true")
  })

  test("a day without lessons says so", async () => {
    setViewportWidth(360)
    server.use(http.get(apiUrl("/v1/me/timetable"), () => HttpResponse.json([])))
    renderSp(<TimetablePage />, { route: "/timetable/" })

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
  test("the address carries a date only when it is one", () => {
    expect(isIsoDate("2026-10-08")).toBe(true)
    expect(isIsoDate("nonsense")).toBe(false)
    expect(isIsoDate(null)).toBe(false)
  })

  test("weeks run Monday to Friday and lessons of a day are sorted by period", () => {
    expect(weekRange("2026-10-05")).toEqual({ from: "2026-10-05", to: "2026-10-09" })
    expect(lessonsOn(weekLessons, "2026-10-07").map((lesson) => lesson.period)).toEqual([1, 2, 3, 4, 5, 6])
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
