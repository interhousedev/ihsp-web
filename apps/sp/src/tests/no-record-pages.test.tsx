/** One explanation for a missing student record on every academic page (no retry, no stacked states, no new request). */
import { describe, expect, test } from "bun:test"
import { apiUrl, problem, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { http } from "msw"
import { ExamsPage } from "../features/exams/components/exams-page"
import { ExcusesPage } from "../features/excuses/components/excuses-page"
import { GradesPage } from "../features/grades/components/grades-page"
import { SubjectsPage } from "../features/subjects/components/subjects-page"
import { TeachersPage } from "../features/teachers/components/teachers-page"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { configureTests, renderSp } from "./helpers"

configureTests()

function noRecord() {
  server.use(http.get(apiUrl("/v1/me/profile"), () => problem(404, "academic/student-not-found", "No record")))
}

const PAGES: [string, () => React.ReactElement][] = [
  ["timetable", () => <TimetablePage />],
  ["subjects", () => <SubjectsPage />],
  ["grades", () => <GradesPage />],
  ["exams", () => <ExamsPage />],
  ["teachers", () => <TeachersPage />],
  ["excuses", () => <ExcusesPage />],
]

describe("missing student record", () => {
  test.each(PAGES)("%s shows the no-record notice without a retry button", async (_name, page) => {
    noRecord()
    renderSp(page())

    expect(await screen.findByTestId("no-student-record")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument()
  })

  test("excuses hides the new-request button", async () => {
    noRecord()
    renderSp(<ExcusesPage />)

    await screen.findByTestId("no-student-record")
    expect(screen.queryByRole("button", { name: /new/i })).not.toBeInTheDocument()
  })
})
