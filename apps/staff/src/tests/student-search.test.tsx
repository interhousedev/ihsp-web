/** Student search across the teacher's groups and the student profile (marks, attendance, lessons with materials). */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { groupStudents, ids, journal } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { StudentProfile } from "../features/students/student-profile"
import { StudentSearch } from "../features/students/search"
import { buildStudentIndex, searchStudents } from "../features/students/utils"
import { configureTests, freezeTime, renderStaff, setValue, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

const first = journal.students[0]
if (!first) throw new Error("fixture: no journal student")

describe("student search", () => {
  test("lists the students of the teacher's journals", async () => {
    renderStaff(<StudentSearch />, { route: "/students/" })

    const list = await screen.findByTestId("student-results")

    expect(within(list).getByText("Brastilov Aleksey")).toBeInTheDocument()
    expect(within(list).getAllByRole("link").length).toBe(groupStudents.length)
  })

  test("one box narrows by any part of the name and a result opens the profile", async () => {
    renderStaff(<StudentSearch />, { route: "/students/" })
    const box = await screen.findByRole("searchbox", { name: "Search by name" })

    setValue(box, "mad naz")

    await waitFor(() => expect(screen.getAllByRole("link")).toHaveLength(1))
    const link = screen.getByRole("link", { name: /Nazarova Madina/ })
    expect(link.getAttribute("href")).toContain(`id=${encodeURIComponent(ids.student3)}`)
  })

  test("says so when nobody matches", async () => {
    renderStaff(<StudentSearch />, { route: "/students/" })
    setValue(await screen.findByRole("searchbox"), "zzz")

    expect(await screen.findByText("No students match “zzz”.")).toBeInTheDocument()
  })

  test("the matcher takes word prefixes in any order", () => {
    const index = buildStudentIndex([
      { option: { subject: journal.subject, audience_key: "2tn2", label: "Physics" }, journal },
    ])

    expect(searchStudents(index, "")).toHaveLength(index.length)
    expect(searchStudents(index, "aleks bra").map((item) => item.userId)).toEqual([first.user_id])
    expect(searchStudents(index, "rastilov")).toHaveLength(0)
  })
})

describe("student profile", () => {
  test("shows marks by subject, attendance and recent lessons with materials", async () => {
    renderStaff(<StudentProfile />, { route: `/students/view/?id=${first.user_id}` })

    expect(await screen.findByRole("heading", { name: "Brastilov Aleksey" })).toBeInTheDocument()
    const marks = await screen.findByTestId("marks-by-subject")
    expect(within(marks).getAllByText("Semester").length).toBeGreaterThan(0)
    expect(within(marks).getAllByText("4.8").length).toBeGreaterThan(0)
    expect(screen.getByTestId("attendance-summary")).toHaveTextContent(/absence/)
    const lessons = await screen.findByTestId("recent-lessons")
    expect(within(lessons).getAllByRole("link").length).toBeGreaterThan(0)
  })

  test("an unknown student says so", async () => {
    renderStaff(<StudentProfile />, { route: "/students/view/?id=nobody" })

    expect(await screen.findByText("This student was not found among your groups.")).toBeInTheDocument()
  })
})
