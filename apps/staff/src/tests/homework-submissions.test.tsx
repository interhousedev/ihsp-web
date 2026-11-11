/** The lesson page's homework submissions panel: counts, students, comments and file links. */
import { describe, expect, test } from "bun:test"
import type { StaffLesson } from "@ihsp/api"
import { apiUrl, ids, server, staffLessonFor } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { LessonPage } from "../features/lessons/components/lesson-page"
import { configureTests, renderStaff } from "./helpers"

configureTests()

const ROUTE = `/lessons/view/?id=${ids.lessonPhysicsToday}`
const lessonData = staffLessonFor(ids.lessonPhysicsToday) as StaffLesson

describe("homework submissions", () => {
  test("shows the badge, the counts and every student with comment and file link", async () => {
    server.use(
      http.get(apiUrl("/v1/staff/lessons/:id"), () =>
        HttpResponse.json({
          ...lessonData,
          homework: { text: "Problems", due_date: "2026-10-08", due_auto: true },
        }),
      ),
      http.get(apiUrl("/v1/staff/lessons/:id/homework/submissions"), () =>
        HttpResponse.json({
          lesson_id: ids.lessonPhysicsToday,
          counts: { submitted: 1, late: 1, missing: 1, total: 3 },
          students: [
            {
              student: { id: ids.student2, first_name: "Aziz", last_name: "Karimov" },
              group_name: "10A",
              subgroup: null,
              status: "submitted",
              submitted_at: "2026-10-07T10:00:00Z",
              comment: "Done it",
              files: [
                {
                  id: "11111111-1111-4111-8111-111111111111",
                  name: "work.pdf",
                  content_type: "application/pdf",
                  size: 10,
                  download_url: "https://files.example/work.pdf",
                },
              ],
            },
            {
              student: { id: "22222222-2222-4222-8222-222222222222", first_name: "Bobur", last_name: "Aliev" },
              group_name: "10A",
              subgroup: null,
              status: "late",
              submitted_at: "2026-10-09T10:00:00Z",
              comment: null,
              files: [],
            },
            {
              student: { id: "33333333-3333-4333-8333-333333333333", first_name: "Dilya", last_name: "Umarova" },
              group_name: "10A",
              subgroup: null,
              status: "missing",
              submitted_at: null,
              comment: null,
              files: [],
            },
          ],
        }),
      ),
    )
    renderStaff(<LessonPage />, { route: ROUTE })

    const panel = (await screen.findByRole("heading", { name: /Submitted homework/ })).closest("section")
    if (!panel) throw new Error("no panel")
    expect(await within(panel).findByText("2/3 submitted")).toBeInTheDocument()
    expect(within(panel).getByText("Submitted: 1 · Late: 1 · Missing: 1")).toBeInTheDocument()
    expect(within(panel).getByText("Karimov Aziz")).toBeInTheDocument()
    expect(within(panel).getByText("Done it")).toBeInTheDocument()
    const link = within(panel).getByRole("link", { name: "work.pdf" })
    expect(link).toHaveAttribute("href", "https://files.example/work.pdf")
    expect(link).toHaveAttribute("target", "_blank")
    expect(within(panel).getByText("Missing")).toBeInTheDocument()
    expect(within(panel).getByText("Late")).toBeInTheDocument()
  })
})
