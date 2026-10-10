/** "My teachers": the list with status and contact chips, the detail page with the week, and the helpers. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import type { MyTeacher, TeacherContacts, TeacherLesson } from "@ihsp/api"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TeacherPage } from "../features/teachers/components/teacher-page"
import { TeachersPage } from "../features/teachers/components/teachers-page"
import { contactChips, teacherStatus } from "../features/teachers/utils/teacher-display"
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

function lesson(over: Partial<TeacherLesson>): TeacherLesson {
  return {
    date: "2026-10-07",
    weekday: 3,
    starts_at: "2026-10-07T09:10:00Z",
    ends_at: "2026-10-07T09:55:00Z",
    subject: "Physics",
    group: "2TN2",
    room: "207",
    ...over,
  }
}

const NOW_TEACHER: MyTeacher = {
  id: "t-1",
  first_name: "Gulnora",
  last_name: "Alieva",
  middle_name: null,
  subjects: ["Mathematics"],
  contacts: { ...NO_CONTACTS, telegram: "gulnora_a", phone: "+998 90 123-45-67", office: "12" },
  teaching_now: true,
  current: lesson({
    subject: "Mathematics",
    room: "305",
    starts_at: "2026-10-07T05:00:00Z",
    ends_at: "2026-10-07T05:45:00Z",
  }),
  next: lesson({ subject: "Mathematics" }),
  week: [lesson({ subject: "Mathematics", room: "305" }), lesson({ weekday: 4, date: "2026-10-08" })],
}
const NEXT_TEACHER: MyTeacher = {
  ...NOW_TEACHER,
  id: "t-2",
  first_name: "Bobur",
  last_name: "Zokirov",
  subjects: ["Physics", "Astronomy"],
  contacts: NO_CONTACTS,
  teaching_now: false,
  current: null,
  next: lesson({}),
}
const IDLE_TEACHER: MyTeacher = { ...NEXT_TEACHER, id: "t-3", last_name: "Yusupova", next: null, week: [] }

function serve(items: MyTeacher[]) {
  server.use(http.get(apiUrl("/v1/me/teachers"), () => HttpResponse.json(items)))
}

describe("teachers list", () => {
  test("shows name, subjects, status line and contact chips", async () => {
    serve([NOW_TEACHER, NEXT_TEACHER, IDLE_TEACHER])
    renderSp(<TeachersPage />)

    const cards = await screen.findAllByTestId("teacher-card")

    expect(cards).toHaveLength(3)
    expect(within(cards[0] as HTMLElement).getByRole("link", { name: "Alieva Gulnora" })).toBeInTheDocument()
    expect(within(cards[0] as HTMLElement).getByText("Now: lesson in 305")).toBeInTheDocument()
    expect(within(cards[0] as HTMLElement).getByRole("link", { name: "@gulnora_a" })).toHaveAttribute(
      "href",
      "https://t.me/gulnora_a",
    )
    expect(within(cards[0] as HTMLElement).getByRole("link", { name: "+998 90 123-45-67" })).toHaveAttribute(
      "href",
      "tel:+998901234567",
    )
    expect(within(cards[0] as HTMLElement).getByRole("button", { name: /Room 12/ })).toBeInTheDocument()
    expect(within(cards[1] as HTMLElement).getByText("Next: 14:10, room 207")).toBeInTheDocument()
    expect(within(cards[1] as HTMLElement).getByText("Astronomy")).toBeInTheDocument()
    expect(within(cards[1] as HTMLElement).getByText("No contacts yet")).toBeInTheDocument()
    expect(within(cards[2] as HTMLElement).getByText("No lessons today")).toBeInTheDocument()
  })

  test("shows the empty state", async () => {
    serve([])
    renderSp(<TeachersPage />)

    expect(await screen.findByText(/No teachers yet/)).toBeInTheDocument()
  })
})

describe("teacher page", () => {
  test("shows the contacts and the week with rooms", async () => {
    serve([NOW_TEACHER])
    renderSp(<TeacherPage />, { route: "/teachers/view/?id=t-1" })

    const grid = await screen.findByTestId("week-grid")

    expect(screen.getByRole("heading", { name: "Alieva Gulnora" })).toBeInTheDocument()
    expect(within(grid).getByText(/Mathematics/)).toBeInTheDocument()
    expect(within(grid).getByText("2TN2 · room 305")).toBeInTheDocument()
    expect(within(grid).getByText("2TN2 · room 207")).toBeInTheDocument()
  })

  test("says when the teacher is not found", async () => {
    serve([NOW_TEACHER])
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

  test("status: now, next today, next on another day, none", () => {
    const now = new Date("2026-10-07T05:12:00Z")
    expect(teacherStatus(NOW_TEACHER, now)).toEqual({ kind: "now", room: "305" })
    expect(teacherStatus(NEXT_TEACHER, now)).toMatchObject({ kind: "next", today: true, room: "207" })
    const later = { ...NEXT_TEACHER, next: lesson({ date: "2026-10-09" }) }
    expect(teacherStatus(later, now)).toMatchObject({ kind: "next", today: false })
    expect(teacherStatus(IDLE_TEACHER, now)).toEqual({ kind: "none" })
  })
})
