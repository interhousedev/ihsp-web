import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { apiUrl, attemptResultPassed, attemptView, ids, lmsCardStudy, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { StepPlayer } from "../features/player/components/step-player"
import { readBody, renderLms } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

const courseId = ids.course
const slug = "derivatives-101"

/** The fixture attempt's deadline is in the past, which would submit it at once; tests that are not about the timer use none. */
function startsAttemptWithoutDeadline() {
  server.use(
    http.post(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/attempts"), () =>
      HttpResponse.json({ ...attemptView, deadline_at: null }),
    ),
  )
}

function renderPlayer(stepId: string, mode: "learn" | "preview" = "learn") {
  return renderLms(<StepPlayer courseId={courseId} stepId={stepId} slug={slug} mode={mode} />, {
    route: `/course/step/?course=${courseId}&step=${stepId}`,
  })
}

describe("step player: text and navigation", () => {
  it("renders Markdown blocks and links to the neighbouring steps", async () => {
    renderPlayer(ids.courseStepText)
    expect(await screen.findByRole("heading", { name: "What is a derivative?", level: 2 })).toBeInTheDocument()
    const next = await screen.findByRole("link", { name: /Next/ })
    // Next removes the trailing slash outside the static export config, so only the query is compared.
    expect(next.getAttribute("href")).toContain(`course=${courseId}&step=${ids.courseStepTest}&slug=${slug}`)
    expect(screen.queryByRole("link", { name: /Previous/ })).not.toBeInTheDocument()
    expect(screen.getByText("1 of 3")).toBeInTheDocument()
  })
})

describe("step player: tests", () => {
  it("never shows correctness before the attempt is submitted, then shows the review", async () => {
    startsAttemptWithoutDeadline()
    const { user } = renderPlayer(ids.courseStepTest)

    // The rules and the best result come first, with a way to start.
    expect(await screen.findByText("Derivative rules quiz")).toBeInTheDocument()
    expect(screen.getByTestId("best-result")).toHaveTextContent("Best result: 2/3")
    await user.click(await screen.findByRole("button", { name: "Try again" }))

    // Open attempt: questions and options only.
    expect(await screen.findByText("What is the derivative of x^2?")).toBeInTheDocument()
    await user.click(screen.getByLabelText("2x"))
    await user.click(screen.getByLabelText("f(x) = 5"))
    expect(screen.queryByText(/correct|incorrect|explanation|passed/i)).not.toBeInTheDocument()
    expect(document.querySelector("[data-correct]")).toBeNull()

    await user.click(screen.getByRole("button", { name: "Submit" }))

    // After the submit the review follows the server's answer.
    const result = await screen.findByRole("region", { name: "Result" })
    expect(result).toHaveTextContent("2/3")
    expect(await screen.findByText("Question 3 · Incorrect")).toBeInTheDocument()
    expect(screen.getByText("d/dx x^3 at x=2 is 3x^2 = 12.")).toBeInTheDocument()
    expect(screen.getByText("Question 1 · Correct")).toBeInTheDocument()
  })

  it("keeps the answers hidden when the test policy sends no review", async () => {
    startsAttemptWithoutDeadline()
    server.use(
      http.post(apiUrl("/v1/lms/attempts/:id/submit"), () =>
        HttpResponse.json({ ...attemptResultPassed, review: null }),
      ),
    )
    const { user } = renderPlayer(ids.courseStepTest)
    await user.click(await screen.findByRole("button", { name: "Try again" }))
    await screen.findByText("What is the derivative of x^2?")
    await user.click(screen.getByRole("button", { name: "Submit" }))
    expect(await screen.findByText("Correct answers are not shown for this test.")).toBeInTheDocument()
    expect(screen.queryByText(/Question 1 · /)).not.toBeInTheDocument()
  })

  it("submits by itself when the timer runs out, after saving the answers", async () => {
    const events: string[] = []
    server.use(
      http.post(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/attempts"), () =>
        HttpResponse.json({ ...attemptView, deadline_at: new Date(Date.now() + 1500).toISOString() }),
      ),
      http.put(apiUrl("/v1/lms/attempts/:id/answers"), async ({ request }) => {
        events.push("put")
        const body = await readBody<{ answers: Record<string, unknown> }>(request)
        return HttpResponse.json({ ...attemptView, answers: body.answers })
      }),
      http.post(apiUrl("/v1/lms/attempts/:id/submit"), () => {
        events.push("submit")
        return HttpResponse.json(attemptResultPassed)
      }),
    )
    const { user } = renderPlayer(ids.courseStepTest)
    await user.click(await screen.findByRole("button", { name: "Try again" }))
    await user.click(await screen.findByLabelText("2x"))
    expect(screen.getByRole("timer")).toBeInTheDocument()

    // Nobody presses Submit: the deadline does it.
    expect(await screen.findByRole("region", { name: "Result" })).toBeInTheDocument()
    expect(events).toEqual(["put", "submit"])
  })

  it("starts preview attempts with preview=true and shows the banner", async () => {
    let previewParam = null as string | null
    server.use(
      http.post(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/attempts"), ({ request }) => {
        previewParam = new URL(request.url).searchParams.get("preview")
        return HttpResponse.json({ ...attemptView, deadline_at: null })
      }),
    )
    const { user } = renderPlayer(ids.courseStepTest, "preview")
    expect(await screen.findByTestId("preview-banner")).toHaveTextContent("Preview.")
    await user.click(await screen.findByRole("button", { name: "Try again" }))
    await screen.findByText("What is the derivative of x^2?")
    expect(previewParam).toBe("true")
  })

  it("shows the pause between attempts when the server refuses a start", async () => {
    server.use(
      http.post(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/attempts"), () =>
        HttpResponse.json(
          {
            type: "lms/attempt-cooldown",
            title: "Pause",
            status: 409,
            params: { available_at: "2026-10-07T11:20:00Z" },
          },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderPlayer(ids.courseStepTest)
    await user.click(await screen.findByRole("button", { name: "Try again" }))
    expect(await screen.findByText(/Next attempt available at/)).toBeInTheDocument()
  })
})

describe("step player: flash cards", () => {
  it("reveals the answer, rates the card and loads the next one", async () => {
    let rating: unknown = null
    server.use(
      http.post(apiUrl("/v1/lms/steps/:stepId/cards/:cardId/review"), async ({ request }) => {
        rating = await readBody(request)
        return HttpResponse.json({ ...lmsCardStudy, card: null })
      }),
    )
    const { user } = renderPlayer(ids.courseStepCards)
    expect(await screen.findByText("d/dx sin x")).toBeInTheDocument()
    expect(screen.queryByText("cos x")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Show answer" }))
    expect(screen.getByText("cos x")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Easy/ }))
    await waitFor(() => expect(rating).toEqual({ rating: "easy" }))
    expect(await screen.findByText(/All cards are done for now/)).toBeInTheDocument()
  })
})
