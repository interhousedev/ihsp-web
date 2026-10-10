/** STF-9, UF-STF-07: the journal. */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import type { Journal } from "@ihsp/api"
import { apiUrl, ids, journal, server, weekLessons } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { JournalPage } from "../features/journal/components/journal-page"
import { applyToggle } from "../features/journal/utils/apply-toggle"
import { optionValue, parseOptionValue, selectedOption } from "../features/journal/utils/selection"
import { configureTests, freezeTime, renderStaff, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

const physics = weekLessons.filter((lesson) => lesson.subject.id === ids.physics)
const firstLesson = physics[0]
if (!firstLesson) throw new Error("fixture: no physics lesson")

function captureToggles(version = 4): { bodies: unknown[] } {
  const captured: { bodies: unknown[] } = { bodies: [] }
  server.use(
    http.post(apiUrl("/v1/staff/journal/toggle"), async ({ request }) => {
      const body = (await request.json()) as { base_version: number }
      captured.bodies.push(body)
      return HttpResponse.json({ attendance_version: body.base_version + (version - 3) })
    }),
  )
  return captured
}

async function grid(): Promise<HTMLElement> {
  return screen.findByTestId("journal-grid")
}

describe("journal", () => {
  test("picks a subject and audience the teacher teaches and shows the grid", async () => {
    renderStaff(<JournalPage />, { route: "/journal/" })

    const picker = await screen.findByRole("combobox", { name: "Subject and audience" })

    expect(picker).toHaveValue(`${ids.physics}|2tn2`)
    expect(within(picker).getByRole("option", { name: "English · 2TN2 subgroup 1" })).toBeInTheDocument()
    const table = await grid()
    expect(within(table).getByText("Brastilov Aleksey")).toBeInTheDocument()
    expect(within(table).getByText("Absences")).toBeInTheDocument()
    expect(within(table).getByText("Semester")).toBeInTheDocument()
  })

  test("the choice is kept in the address (?subject=&audience=)", async () => {
    renderStaff(<JournalPage />, { route: `/journal/?subject=${ids.english}&audience=2tn2:1` })

    const picker = await screen.findByRole("combobox", { name: "Subject and audience" })

    expect(picker).toHaveValue(`${ids.english}|2tn2:1`)
  })

  test("a column header opens the lesson; a column without attendance is marked", async () => {
    renderStaff(<JournalPage />, { route: "/journal/" })

    const table = await grid()
    const headers = within(table).getAllByRole("columnheader")

    const link = within(headers[1] as HTMLElement).getByRole("link")
    expect(link.getAttribute("href")).toContain(`id=${encodeURIComponent(firstLesson.id)}`)
    expect(within(table).getAllByText("Not taken").length).toBeGreaterThan(0)
  })

  test("tapping a cell toggles the absence and sends base_version; the next toggle uses the new version", async () => {
    const captured = captureToggles()
    const { user } = renderStaff(<JournalPage />, { route: "/journal/" })

    const table = await grid()
    const cell = within(table).getAllByRole("button", { name: /^Nazarova Madina, .*: present$/ })[0] as HTMLElement
    await user.click(cell)

    await waitFor(() =>
      expect(captured.bodies).toEqual([
        { lesson_id: firstLesson.id, student_id: ids.student3, absent: true, late: false, base_version: 3 },
      ]),
    )
    await waitFor(() => expect(cell).toHaveAttribute("aria-pressed", "true"))
    expect(cell).toHaveAccessibleName(/: absent$/)

    await user.click(cell)

    await waitFor(() => expect(captured.bodies).toHaveLength(2))
    expect(captured.bodies[1]).toEqual({
      lesson_id: firstLesson.id,
      student_id: ids.student3,
      absent: false,
      late: true,
      base_version: 4,
    })
    await waitFor(() => expect(cell).toHaveAccessibleName(/: late$/))

    await user.click(cell)

    await waitFor(() => expect(captured.bodies).toHaveLength(3))
    expect(captured.bodies[2]).toMatchObject({ absent: false, late: false })
  })

  test("the absence count of the student follows the toggle", async () => {
    captureToggles()
    const { user } = renderStaff(<JournalPage />, { route: "/journal/" })

    const table = await grid()
    const row = within(table).getByText("Nazarova Madina").closest("tr") as HTMLElement
    expect(within(row).getAllByRole("cell").at(-2)).toHaveTextContent("0")
    await user.click(within(row).getAllByRole("button")[0] as HTMLElement)

    await waitFor(() => expect(within(row).getAllByRole("cell").at(-2)).toHaveTextContent("1"))
  })

  test("a failed toggle is rolled back and shown", async () => {
    server.use(
      http.post(apiUrl("/v1/staff/journal/toggle"), () =>
        HttpResponse.json({ type: "common/conflict", status: 409, title: "Conflict" }, { status: 409 }),
      ),
    )
    const { user } = renderStaff(<JournalPage />, { route: "/journal/" })

    const table = await grid()
    const cell = within(table).getAllByRole("button", { name: /^Nazarova Madina, .*: present$/ })[0] as HTMLElement
    await user.click(cell)

    await waitFor(() => expect(cell).toHaveAttribute("aria-pressed", "false"))
  })

  test("cells of lessons older than 7 days are read-only", async () => {
    const closed: Journal = { ...journal, lessons: journal.lessons.map((lesson) => ({ ...lesson, editable: false })) }
    server.use(http.get(apiUrl("/v1/staff/journal"), () => HttpResponse.json(closed)))
    renderStaff(<JournalPage />, { route: "/journal/" })

    const table = await grid()

    expect(within(table).queryAllByRole("button")).toHaveLength(0)
    expect(within(table).getAllByRole("img", { name: /Nazarova Madina/ }).length).toBeGreaterThan(0)
  })

  test("Export downloads the grid as CSV", async () => {
    const created: Blob[] = []
    const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL }
    URL.createObjectURL = (blob: Blob | MediaSource) => {
      created.push(blob as Blob)
      return "blob:journal"
    }
    URL.revokeObjectURL = () => undefined
    spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
    const requests: string[] = []
    server.use(
      http.get(apiUrl("/v1/staff/journal.csv"), ({ request }) => {
        requests.push(request.url)
        return new HttpResponse("a;b\n", { headers: { "Content-Type": "text/csv" } })
      }),
    )
    try {
      const { user } = renderStaff(<JournalPage />, { route: "/journal/" })

      await grid()
      await user.click(screen.getByRole("button", { name: "Export CSV" }))

      await waitFor(() => expect(created).toHaveLength(1))
      expect(requests[0]).toContain(`subject_id=${ids.physics}`)
      expect(requests[0]).toContain("audience_key=2tn2")
    } finally {
      URL.createObjectURL = original.create
      URL.revokeObjectURL = original.revoke
    }
  })

  test("a teacher with no lessons sees an explanation", async () => {
    server.use(http.get(apiUrl("/v1/staff/journal/options"), () => HttpResponse.json([])))
    renderStaff(<JournalPage />, { route: "/journal/" })

    expect(await screen.findByText("You have no lessons to show in the journal yet.")).toBeInTheDocument()
  })
})

describe("journal helpers", () => {
  test("option values round-trip, also with a colon in the audience key", () => {
    const option = { subject: journal.subject, audience_key: "2tn2:1", label: "x" }
    expect(parseOptionValue(optionValue(option))).toEqual({ subject: journal.subject.id, audience: "2tn2:1" })
    expect(parseOptionValue("nonsense")).toBeNull()
  })

  test("a missing or unknown choice falls back to the first option", () => {
    const options = [
      { subject: journal.subject, audience_key: "a", label: "A" },
      { subject: journal.subject, audience_key: "b", label: "B" },
    ]
    expect(selectedOption(options, null, null)?.audience_key).toBe("a")
    expect(selectedOption(options, journal.subject.id, "b")?.audience_key).toBe("b")
    expect(selectedOption([], null, null)).toBeNull()
  })

  test("applyToggle changes the cell, the count and the column", () => {
    const lessonId = journal.lessons[0]?.id ?? ""
    const next = applyToggle(journal, { lessonId, studentId: ids.student3, absent: true })
    const student = next.students.find((item) => item.user_id === ids.student3)
    expect(student?.absences).toBe(1)
    expect(student?.cells.find((cell) => cell.lesson_id === lessonId)?.absent).toBe(true)
    expect(next.lessons[0]?.attendance_submitted).toBe(true)
    const back = applyToggle(next, { lessonId, studentId: ids.student3, absent: false })
    expect(back.students.find((item) => item.user_id === ids.student3)?.absences).toBe(0)
  })
})
