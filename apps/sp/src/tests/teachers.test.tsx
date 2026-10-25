/** My teachers: the cards (photo, subject links, nearest class, next two weeks, contacts), the profile page with the timetable, and the helpers. */
import { afterEach, beforeEach, describe, expect, setSystemTime, test } from "bun:test"
import { apiUrl, ids, myTeacherOf, server } from "@ihsp/test-utils"
import type { MyTeacher, TeacherContacts, TeacherLesson } from "@ihsp/api"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TeacherPage } from "../features/teachers/components/teacher-page"
import { TeachersPage } from "../features/teachers/components/teachers-page"
import { contactChips, nearestLesson } from "../features/teachers/utils/teacher-display"
import { configureTests, freezeTime, renderSp, unfreezeTime } from "./helpers"

configureTests()
beforeEach(freezeTime)
afterEach(unfreezeTime)

const NO_CONTACTS: TeacherContacts = {
  telegram: null,
  email: null,
  phone: null,
  office_hours: null,
  office: null,
  note: null,
}

const PHOTO_URL = "https://files.example.test/photos/kalandarova.jpg"

/** Next.js drops the trailing slash of a static route in tests (`/teachers/view?id=`); the app keeps `/teachers/view/?id=`. */
function normalizeHref(href: string | null): string | null {
  return href?.replace(/([^/])\?/, "$1/?") ?? null
}

/** The fixture physics teacher of the student's group (Kalandarova Gavxar). */
const KALANDAROVA = myTeacherOf(ids.teacherKalandarova) as MyTeacher

const WITH_PHOTO: MyTeacher = { ...KALANDAROVA, photo_url: PHOTO_URL }

const IDLE_TEACHER: MyTeacher = {
  ...KALANDAROVA,
  id: "t-idle",
  first_name: "Bobur",
  last_name: "Zokirov",
  photo_url: null,
  subjects: ["Informatics"],
  subject_refs: [{ id: ids.informatics, name: "Informatics" }],
  contacts: NO_CONTACTS,
  current: null,
  next: null,
  week: [],
  upcoming: [],
}

/** A lesson on `date` shaped like the fixture's next lesson. */
function lessonOn(date: string): TeacherLesson {
  return { ...(KALANDAROVA.next as TeacherLesson), date }
}

function serve(items: MyTeacher[]) {
  server.use(http.get(apiUrl("/v1/me/teachers"), () => HttpResponse.json(items)))
}

function serveOne(teacher: MyTeacher) {
  server.use(http.get(apiUrl(`/v1/me/teachers/${teacher.id}`), () => HttpResponse.json(teacher)))
}

describe("teachers list", () => {
  test("a card shows the photo, the subject links, the nearest class and the contacts", async () => {
    serve([WITH_PHOTO, IDLE_TEACHER])
    renderSp(<TeachersPage />)

    const cards = await screen.findAllByTestId("teacher-card")
    const card = cards[0] as HTMLElement

    expect(cards).toHaveLength(2)
    expect(within(card).getByRole("img", { name: "Photo of Kalandarova Gavxar" }).getAttribute("src")).toBe(PHOTO_URL)
    expect(normalizeHref(within(card).getByRole("link", { name: "Kalandarova Gavxar" }).getAttribute("href"))).toBe(
      `/teachers/view/?id=${ids.teacherKalandarova}`,
    )
    expect(normalizeHref(within(card).getByRole("link", { name: "Physics" }).getAttribute("href"))).toBe(
      `/subjects/view/?id=${ids.physics}`,
    )
    expect(normalizeHref(within(card).getByRole("link", { name: "@gavxar_k" }).getAttribute("href"))).toBe(
      "https://t.me/gavxar_k",
    )
  })

  test("the nearest class shows the time and room and links to its lesson", async () => {
    serve([WITH_PHOTO])
    renderSp(<TeachersPage />)

    const card = (await screen.findByTestId("teacher-card")) as HTMLElement
    const nearest = within(card).getByRole("link", { name: /08:30–09:15/ })

    expect(within(card).getByText("Next class")).toBeInTheDocument()
    expect(nearest).toHaveTextContent("room 102")
    expect(normalizeHref(nearest.getAttribute("href"))).toBe(`/lessons/view/?id=${KALANDAROVA.next?.lesson_id}`)
  })

  test("a class that is not a stored lesson yet links to the subject's lessons", async () => {
    const next = { ...(KALANDAROVA.next as TeacherLesson), lesson_id: null }
    serve([{ ...WITH_PHOTO, next, upcoming: [] }])
    renderSp(<TeachersPage />)

    const card = (await screen.findByTestId("teacher-card")) as HTMLElement
    const nearest = within(card).getByRole("link", { name: /08:30–09:15/ })

    expect(normalizeHref(nearest.getAttribute("href"))).toBe(`/subjects/view/?id=${ids.physics}&tab=lessons`)
  })

  test("the next two weeks are a compact list that opens on demand", async () => {
    serve([WITH_PHOTO])
    renderSp(<TeachersPage />)

    const card = (await screen.findByTestId("teacher-card")) as HTMLElement
    const upcoming = within(card).getByRole("region", { name: "Next two weeks" })
    const total = KALANDAROVA.upcoming.length
    expect(total).toBeGreaterThan(3)
    expect(within(upcoming).getAllByRole("listitem")).toHaveLength(3)

    fireEvent.click(within(card).getByRole("button", { name: `Show all (${total})` }))

    expect(within(upcoming).getAllByRole("listitem")).toHaveLength(total)
    expect(within(card).getByRole("button", { name: "Show less" })).toBeInTheDocument()
  })

  test("a teacher with no class in two weeks says so and has no contacts yet", async () => {
    serve([IDLE_TEACHER])
    renderSp(<TeachersPage />)

    const card = (await screen.findByTestId("teacher-card")) as HTMLElement
    expect(within(card).getByText("No classes in the next two weeks")).toBeInTheDocument()
    expect(within(card).getByText("Informatics")).toBeInTheDocument()
    expect(within(card).getByText("No contacts yet")).toBeInTheDocument()
  })

  test("shows the empty state", async () => {
    serve([])
    renderSp(<TeachersPage />)

    expect(await screen.findByText(/No teachers yet/)).toBeInTheDocument()
  })
})

describe("teacher profile", () => {
  test("shows the photo, subjects and contacts, and the week in every group with the student's group highlighted", async () => {
    serveOne(WITH_PHOTO)
    renderSp(<TeacherPage />, { route: `/teachers/view/?id=${ids.teacherKalandarova}` })

    const days = await screen.findAllByTestId("teacher-day")

    expect(screen.getByRole("heading", { name: "Kalandarova Gavxar" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Photo of Kalandarova Gavxar" }).getAttribute("src")).toBe(PHOTO_URL)
    expect(normalizeHref(screen.getByRole("link", { name: "Physics" }).getAttribute("href"))).toBe(
      `/subjects/view/?id=${ids.physics}`,
    )
    expect(screen.getByRole("link", { name: "@gavxar_k" })).toBeInTheDocument()

    // Monday: the student's own lesson, highlighted.
    const own = within(days[0] as HTMLElement)
      .getByText("09:25–10:10 · Physics")
      .closest("li")
    expect(own?.getAttribute("data-mine")).toBe("true")
    expect(within(days[0] as HTMLElement).getByText("2TN2 · room 102")).toBeInTheDocument()

    // Tuesday: another group, muted, with its group name.
    const other = within(days[1] as HTMLElement)
      .getByText("1TN1 · room 101")
      .closest("li")
    expect(other?.getAttribute("data-mine")).toBe("false")
    expect(within(days[1] as HTMLElement).getByText("11:25–12:10 · Physics")).toBeInTheDocument()

    // Wednesday: the cancelled lesson is marked.
    expect(within(days[2] as HTMLElement).getByText("Cancelled")).toBeInTheDocument()
  })

  test("only Monday to Friday are shown", async () => {
    serveOne(WITH_PHOTO)
    renderSp(<TeacherPage />, { route: `/teachers/view/?id=${ids.teacherKalandarova}` })

    const days = await screen.findAllByTestId("teacher-day")

    expect(days.map((day) => day.getAttribute("aria-label"))).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ])
    expect(screen.queryByLabelText("Saturday")).toBeNull()
    expect(screen.queryByLabelText("Sunday")).toBeNull()
  })

  test("the week switcher asks the server for the next week and goes back to this week", async () => {
    const ranges: string[] = []
    serveOne(WITH_PHOTO)
    server.use(
      http.get(apiUrl(`/v1/me/teachers/${ids.teacherKalandarova}/timetable`), ({ request }) => {
        ranges.push(new URL(request.url).searchParams.get("from") ?? "")
        return HttpResponse.json([])
      }),
    )
    renderSp(<TeacherPage />, { route: `/teachers/view/?id=${ids.teacherKalandarova}` })
    await screen.findAllByTestId("teacher-day")

    fireEvent.click(screen.getByRole("button", { name: "Next week" }))
    await waitFor(() => expect(ranges).toContain("2026-10-12"))

    fireEvent.click(screen.getByRole("button", { name: "This week" }))
    await waitFor(() => expect(ranges.at(-1)).toBe("2026-10-05"))
  })

  test("on a weekend this week is the week after, as in the calendar", async () => {
    setSystemTime(new Date("2026-10-10T05:12:00Z")) // Saturday 10 October, 10:12 in Tashkent
    const ranges: string[] = []
    serveOne(WITH_PHOTO)
    server.use(
      http.get(apiUrl(`/v1/me/teachers/${ids.teacherKalandarova}/timetable`), ({ request }) => {
        ranges.push(new URL(request.url).searchParams.get("from") ?? "")
        return HttpResponse.json([])
      }),
    )
    renderSp(<TeacherPage />, { route: `/teachers/view/?id=${ids.teacherKalandarova}` })
    await screen.findAllByTestId("teacher-day")

    expect(ranges[0]).toBe("2026-10-12")
    expect(screen.getByRole("button", { name: "This week" })).toBeDisabled()
  })

  test("says when the teacher is not found", async () => {
    renderSp(<TeacherPage />, { route: "/teachers/view/?id=nobody" })

    expect(await screen.findByText("Teacher not found")).toBeInTheDocument()
  })
})

describe("helpers", () => {
  test("contact chips keep a fixed order and skip empty fields", () => {
    const chips = contactChips({ ...NO_CONTACTS, email: "a@b.uz", telegram: "abcde", office_hours: "Mon 15:00" })
    expect(chips.map((chip) => chip.kind)).toEqual(["telegram", "email", "hours"])
    expect(chips[2]?.href).toBeNull()
  })

  test("the nearest class is the running one, then the next, then the first of the two weeks", () => {
    const running = lessonOn("2026-10-07")
    const next = lessonOn("2026-10-08")
    const first = lessonOn("2026-10-09")

    expect(nearestLesson({ current: running, next, upcoming: [first] })).toBe(running)
    expect(nearestLesson({ current: null, next, upcoming: [first] })).toBe(next)
    expect(nearestLesson({ current: null, next: null, upcoming: [first] })).toBe(first)
    expect(nearestLesson({ current: null, next: null, upcoming: [] })).toBeNull()
  })
})
