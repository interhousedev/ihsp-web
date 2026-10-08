import { describe, expect, it, setDefaultTimeout } from "bun:test"
import type { AttemptOverrideBody } from "@ihsp/api"
import { apiUrl, ids, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { AdminPage } from "../features/admin/components/admin-page"
import { PreviewPage } from "../features/preview/components/preview-page"
import { AttemptReviewPage } from "../features/students/components/attempt-review-page"
import { StudentsPage } from "../features/students/components/students-page"
import { authorSession, readBody, renderLms, testerSession } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

describe("students", () => {
  it("lists students with progress and links their attempts to the review page", async () => {
    renderLms(<StudentsPage courseId={ids.course} />, {
      route: `/edit/students/?id=${ids.course}`,
      session: authorSession,
    })
    expect(await screen.findByText("Brastilov Aleksey")).toBeInTheDocument()
    expect(screen.getByText("33%")).toBeInTheDocument()
    expect(screen.getByText("2/3")).toBeInTheDocument()
    const review = screen.getByRole("link", { name: "Review" })
    expect(review.getAttribute("href")).toContain(`id=${ids.attempt}&course=${ids.course}`)
  })

  it("is closed to staff without the review permission", async () => {
    renderLms(<StudentsPage courseId={ids.course} />, { session: testerSession })
    expect(await screen.findByText("No access")).toBeInTheDocument()
  })
})

describe("attempt review", () => {
  it("shows the answers with the verdicts and overrides the score with a comment", async () => {
    let body = null as AttemptOverrideBody | null
    server.use(
      http.post(apiUrl("/v1/lms/attempts/:id/override"), async ({ request }) => {
        body = await readBody<AttemptOverrideBody>(request)
        return HttpResponse.json({
          id: ids.attempt,
          score: 2,
          max_score: 3,
          passed: true,
          submitted_at: "2026-10-06T12:00:00Z",
          review: null,
          user: { id: ids.student, first_name: "Aleksey", last_name: "Brastilov" },
          variant: {},
          answers: {},
          revision_id: "0000000f-0000-4000-8000-000000000002",
          override_score: body.score,
          override_comment: body.comment,
        })
      }),
    )
    const { user } = renderLms(<AttemptReviewPage attemptId={ids.attempt} courseId={ids.course} />, {
      route: `/edit/attempt/?id=${ids.attempt}&course=${ids.course}`,
      session: authorSession,
    })
    expect(await screen.findByText("Brastilov Aleksey")).toBeInTheDocument()
    expect(screen.getByText("Question 3 · Incorrect")).toBeInTheDocument()
    await user.clear(screen.getByLabelText("Score (0 to 3)"))
    await user.type(screen.getByLabelText("Score (0 to 3)"), "3")
    expect(screen.getByRole("button", { name: "Save override" })).toBeDisabled()
    await user.type(screen.getByLabelText("Comment"), "12 was entered as 12.0")
    await user.click(screen.getByRole("button", { name: "Save override" }))
    await waitFor(() => expect(body).toEqual({ score: 3, comment: "12 was entered as 12.0" }))
    expect(await screen.findByTestId("override-note")).toHaveTextContent(
      "Score overridden (was 2): 12 was entered as 12.0",
    )
  })
})

describe("preview", () => {
  it("opens the draft player under the Preview banner for staff with view_drafts", async () => {
    renderLms(<PreviewPage courseId={ids.course} stepId={ids.courseStepTest} />, {
      route: `/edit/preview/?id=${ids.course}&step=${ids.courseStepTest}`,
      session: testerSession,
    })
    expect(await screen.findByTestId("preview-banner")).toBeInTheDocument()
    expect(await screen.findByText("Derivative rules quiz")).toBeInTheDocument()
  })

  it("lists the draft outline when no step is given", async () => {
    renderLms(<PreviewPage courseId={ids.course} stepId={null} />, {
      route: `/edit/preview/?id=${ids.course}`,
      session: testerSession,
    })
    expect(await screen.findByRole("link", { name: "Start preview" })).toBeInTheDocument()
    expect(screen.getByTestId("preview-banner")).toBeInTheDocument()
  })

  it("denies people without view_drafts", async () => {
    renderLms(<PreviewPage courseId={ids.course} stepId={null} />, { session: {} })
    expect(await screen.findByText("No access")).toBeInTheDocument()
  })
})

describe("create course", () => {
  it("proposes an address from the title and opens the editor after creating", async () => {
    let body: unknown = null
    server.use(
      http.post(apiUrl("/v1/lms/courses"), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({ id: "new-course-id" })
      }),
    )
    const { user } = renderLms(<AdminPage />, { route: "/admin/" })
    await user.type(await screen.findByLabelText("Title"), "Linear Algebra 2")
    expect(screen.getByLabelText("Address")).toHaveValue("linear-algebra-2")
    await user.selectOptions(screen.getByLabelText("Visibility"), "invite")
    await user.click(screen.getByRole("button", { name: "Create course" }))
    await waitFor(() =>
      expect(body).toEqual({ title: "Linear Algebra 2", slug: "linear-algebra-2", visibility: "invite" }),
    )
    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith("/edit/?id=new-course-id"))
  })

  it("does not send an invalid address", async () => {
    let called = false
    server.use(
      http.post(apiUrl("/v1/lms/courses"), () => {
        called = true
        return HttpResponse.json({ id: "x" })
      }),
    )
    const { user } = renderLms(<AdminPage />, { route: "/admin/" })
    await user.type(await screen.findByLabelText("Title"), "Ab")
    await user.click(screen.getByRole("button", { name: "Create course" }))
    expect(await screen.findByText("Use 3 to 60 Latin letters, digits or dashes.")).toBeInTheDocument()
    expect(called).toBe(false)
  })
})
