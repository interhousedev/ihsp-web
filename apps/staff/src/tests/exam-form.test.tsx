/** ExamForm on its own: validation, the payload of a write, the refusal of the backend. */
import { describe, expect, test } from "bun:test"
import type { StaffAssessmentItem } from "@ihsp/api"
import { apiUrl, assessmentIds, group2TN2, ids, problem, server, staffAssessments } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ExamForm } from "../features/exams/components/exam-form"
import { weekPeriods } from "../features/exams/utils/controls"
import { configureTests, renderStaff, setValue } from "./helpers"

configureTests()

const math = staffAssessments.find((entry) => entry.id === assessmentIds.mathMidterm) as StaffAssessmentItem
const subjects = [{ id: ids.physics, name: "Physics", subgroup: "" as const }]
const group = { id: group2TN2.id, name: "2TN2" } as never
const periods = weekPeriods(staffAssessments)

function renderForm(state: Parameters<typeof ExamForm>[0]["state"], onDone = () => undefined) {
  return renderStaff(
    <ExamForm group={group} state={state} subjects={subjects as never} periods={periods} onDone={onDone} />,
  )
}

describe("ExamForm", () => {
  test("shows the messages for a missing subject and date and sends nothing", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/staff/assessments"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({})
      }),
    )
    const { user } = renderForm({ mode: "add", prefill: {} })
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Choose a subject.")).toBeInTheDocument()
    expect(screen.getByText("Choose a date.")).toBeInTheDocument()
    expect(bodies).toEqual([])
  })

  test("a control week fixes the kind; a mismatching kind clears the week", async () => {
    const { user } = renderForm({ mode: "add", prefill: { subjectId: ids.physics, date: "2026-10-15", kind: "final" } })
    await user.selectOptions(screen.getByLabelText("Control week"), "midterm_1")
    expect(screen.getByLabelText("Kind")).toHaveValue("midterm")
    await user.selectOptions(screen.getByLabelText("Kind"), "other")
    expect(screen.getByLabelText("Control week")).toHaveValue("")
  })

  test("a stored exam: Save sends the changed field; the editor closes", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/staff/assessments/:id"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(math)
      }),
    )
    let done = 0
    const { user } = renderForm({ mode: "edit", item: math }, () => void (done += 1))
    setValue(screen.getByLabelText("Room"), "777")
    await user.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(done).toBe(1))
    expect(bodies).toEqual([expect.objectContaining({ room: "777" })])
  })

  test("a refusal of the backend is shown and the form stays open", async () => {
    server.use(
      http.patch(apiUrl("/v1/staff/assessments/:id"), () =>
        problem(403, "academic/not-assessment-teacher", "Only a teacher of the subject may do this"),
      ),
    )
    let done = 0
    const { user } = renderForm({ mode: "edit", item: math }, () => void (done += 1))
    setValue(screen.getByLabelText("Room"), "305")
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Administration can do this")
    expect(done).toBe(0)
  })

  test("Cancel closes without a request", async () => {
    let done = 0
    const { user } = renderForm({ mode: "add", prefill: {} }, () => void (done += 1))
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(done).toBe(1)
  })
})
