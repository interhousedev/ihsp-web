import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { apiUrl, attemptView, ids, problem, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { StepPlayer } from "../features/player/components/step-player"
import { readBody, renderLms } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

const courseId = ids.course
const slug = "derivatives-101"

function renderTest() {
  return renderLms(
    <StepPlayer courseId={courseId} stepId={ids.courseStepTest} slug={slug} block={null} mode="learn" />,
    { route: `/course/${courseId}/step/${ids.courseStepTest}/` },
  )
}

describe("attempt answers are kept when saving fails (UF-LMS-04)", () => {
  it("keeps the answers after a failed save and saves them again on retry", async () => {
    const saved: Record<string, unknown>[] = []
    let calls = 0
    server.use(
      http.post(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/attempts"), () =>
        HttpResponse.json({ ...attemptView, deadline_at: null }),
      ),
      http.put(apiUrl("/v1/lms/attempts/:id/answers"), async ({ request }) => {
        calls += 1
        if (calls === 1) return problem(500, "common/unavailable", "Unavailable")
        const body = await readBody<{ answers: Record<string, unknown> }>(request)
        saved.push(body.answers)
        return HttpResponse.json({ ...attemptView, answers: body.answers })
      }),
    )
    const { user } = renderTest()
    await user.click(await screen.findByRole("button", { name: "Try again" }))
    await user.click(await screen.findByLabelText("2x"))

    expect(
      await screen.findByText("Could not save answers. They are kept on this page; try again."),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Retry save" }))

    await waitFor(() => expect(saved).toHaveLength(1))
    expect(Object.keys(saved[0] ?? {})).toHaveLength(1)
    expect(screen.queryByText("Could not save answers. They are kept on this page; try again.")).not.toBeInTheDocument()
  })
})
