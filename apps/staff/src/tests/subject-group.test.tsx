/** The teacher's subject group page (students, notebook, lessons) and a student's record in the subject. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { ids } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { GroupPage } from "../features/subjects/components/group-page"
import { StudentPage } from "../features/subjects/components/student-page"
import { SubjectPage } from "../features/subjects/components/subject-page"
import { subjectGroupHref, subjectStudentHref } from "../features/subjects/utils/hrefs"
import { configureTests, freezeTime, hrefOf, messages, renderStaff, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

const notebookTexts = JSON.parse(
  readFileSync(join(import.meta.dir, "../../../sp/messages/en/notebooks.json"), "utf8"),
) as Messages
const withNotebooks = mergeMessages(messages.en as Messages, notebookTexts)

describe("subject groups", () => {
  test("an undivided group has one link; a divided one a link per subgroup", async () => {
    renderStaff(<SubjectPage />, { messages: withNotebooks, route: `/subjects/view/?id=${ids.english}` })
    expect(await screen.findByRole("link", { name: "Subgroup 1" })).toBeTruthy()
    expect(hrefOf(screen.getByRole("link", { name: "Subgroup 2" }))).toBe(
      subjectGroupHref(ids.english, ids.group2TN2, 2),
    )
    expect(screen.queryByRole("link", { name: "Students and lessons" })).toBeNull()
  })

  test("the whole group lists every student with their subgroup and the lessons by week", async () => {
    renderStaff(<GroupPage />, {
      messages: withNotebooks,
      route: subjectGroupHref(ids.math, ids.group2TN2),
    })
    expect(await screen.findByRole("heading", { name: "2TN2", level: 1 })).toBeTruthy()
    const students = screen.getByRole("heading", { name: "Students (4)" }).parentElement as HTMLElement
    expect(hrefOf(within(students).getByRole("link", { name: /Ismoilov Jasur/ }))).toBe(
      subjectStudentHref(ids.math, ids.group2TN2, null, ids.student2),
    )
    expect(screen.getByRole("heading", { name: "This week" })).toBeTruthy()
    expect(screen.getByText(/Quadratic equations/)).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Upcoming" })).toBeTruthy()
  })

  test("a subgroup lists only its students (and those without a subgroup)", async () => {
    renderStaff(<GroupPage />, {
      messages: withNotebooks,
      route: subjectGroupHref(ids.english, ids.group2TN2, 1),
    })
    expect(await screen.findByRole("heading", { name: "2TN2 · subgroup 1", level: 1 })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Students (3)" })).toBeTruthy()
    expect(screen.queryByRole("link", { name: /Ismoilov/ })).toBeNull()
  })

  test("a group the teacher does not teach shows an error", async () => {
    renderStaff(<GroupPage />, { messages: withNotebooks, route: subjectGroupHref(ids.math, ids.group1TN1) })
    expect(await screen.findByRole("button", { name: /retry|try again/i })).toBeTruthy()
    expect(screen.queryByRole("heading", { name: /Students/ })).toBeNull()
  })
})

describe("a student's record", () => {
  test("shows marks with the average, homework and attendance", async () => {
    renderStaff(<StudentPage />, {
      messages: withNotebooks,
      route: subjectStudentHref(ids.math, ids.group2TN2, null, ids.student2),
    })
    expect(await screen.findByRole("heading", { name: "Ismoilov Jasur", level: 1 })).toBeTruthy()
    expect(screen.getByText("4.33")).toBeTruthy()
    expect(within(screen.getByRole("list", { name: "Marks" })).getAllByRole("listitem")).toHaveLength(3)
    expect(screen.getByText("Note: Photos uploaded to Drive")).toBeTruthy()
    expect(screen.getByText("Absences: 1 of 12 lessons")).toBeTruthy()
  })

  test("a student of another subgroup is not shown", async () => {
    renderStaff(<StudentPage />, {
      messages: withNotebooks,
      route: subjectStudentHref(ids.english, ids.group2TN2, 1, ids.student2),
    })
    expect(await screen.findByRole("button", { name: /retry|try again/i })).toBeTruthy()
    expect(screen.queryByRole("heading", { name: "Ismoilov Jasur" })).toBeNull()
  })
})
