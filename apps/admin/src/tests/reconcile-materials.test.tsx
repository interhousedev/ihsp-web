/** ADM-subjects: "Check that all lesson materials are in the notebook" starts a job, polls it and shows the totals. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ReconcileMaterialsButton } from "../features/subjects/components/reconcile-materials-button"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

const SUBJECT = "11111111-1111-4111-8111-111111111111"

describe("admin reconcile materials", () => {
  test("starts the job, polls until done and shows the counts", async () => {
    let polls = 0
    server.use(
      http.get(apiUrl(`/v1/admin/subject-materials/subjects/${SUBJECT}/reconcile/:jobId`), ({ params }) => {
        polls += 1
        return HttpResponse.json({
          job_id: String(params.jobId),
          status: polls < 2 ? "running" : "done",
          done: polls >= 2,
          notebooks: 4,
          added: 5,
          already_present: 6,
          skipped: 1,
        })
      }),
    )
    const { user } = renderAdmin(<ReconcileMaterialsButton subjectId={SUBJECT} />)
    await user.click(screen.getByRole("button", { name: "Check that all lesson materials are in the notebook" }))

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Checked 4 notebooks: 5 added, 6 already present, 1 to retry later.",
    )
    expect(polls).toBeGreaterThanOrEqual(2)
  })

  test("shows an error when the job fails", async () => {
    server.use(
      http.get(apiUrl(`/v1/admin/subject-materials/subjects/${SUBJECT}/reconcile/:jobId`), ({ params }) =>
        HttpResponse.json({
          job_id: String(params.jobId),
          status: "failed",
          done: true,
          notebooks: 0,
          added: 0,
          already_present: 0,
          skipped: 0,
        }),
      ),
    )
    const { user } = renderAdmin(<ReconcileMaterialsButton subjectId={SUBJECT} />)
    await user.click(screen.getByRole("button", { name: "Check that all lesson materials are in the notebook" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("The check did not finish. Try again.")
  })
})
