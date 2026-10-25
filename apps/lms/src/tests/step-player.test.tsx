import { describe, expect, it, setDefaultTimeout } from "bun:test"
import type { StepView } from "@ihsp/api"
import {
  apiUrl,
  attemptResultPassed,
  attemptView,
  ids,
  lmsCardStudy,
  problem,
  server,
  stepViewCards,
  stepViewTest,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
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

function renderPlayer(stepId: string, mode: "learn" | "preview" = "learn", block: number | null = null) {
  return renderLms(<StepPlayer courseId={courseId} stepId={stepId} slug={slug} block={block} mode={mode} />, {
    route: `/course/step/?course=${courseId}&step=${stepId}`,
  })
}

/** A lesson of three steps: a text that is passed, a test that is not and flash cards that are not. */
const mixedStep: StepView = {
  ...stepViewTest,
  title: "Derivative rules quiz",
  blocks: [
    { id: "t1", type: "text", markdown: "First read this.", passed: true },
    ...stepViewTest.blocks.map((item) => (item.type === "test" ? { ...item, passed: false, points_earned: 0 } : item)),
    { id: "c1", type: "flashcards", cards_count: 4, due: 4, passed: false },
  ],
  blocks_total: 3,
  blocks_passed: 1,
  points_total: 3,
  points_earned: 0,
}

function servesMixedStep() {
  server.use(http.get(apiUrl("/v1/lms/courses/:courseId/steps/:stepId"), () => HttpResponse.json(mixedStep)))
}

describe("step player: text and navigation", () => {
  it("renders Markdown blocks and links to the neighbouring lessons", async () => {
    renderPlayer(ids.courseStepText)
    expect(await screen.findByRole("heading", { name: "What is a derivative?", level: 2 })).toBeInTheDocument()
    const next = await screen.findByRole("link", { name: /Next lesson/ })
    // Next removes the trailing slash outside the static export config, so only the query is compared.
    expect(next.getAttribute("href")).toContain(`course=${courseId}&step=${ids.courseStepTest}&slug=${slug}`)
    expect(screen.queryByRole("link", { name: /Previous/ })).not.toBeInTheDocument()
  })

  it("shows the lesson number, the steps passed and the points like the Stepik header", async () => {
    renderPlayer(ids.courseStepTest)
    const title = await screen.findByRole("heading", { name: /Derivative rules quiz/, level: 1 })
    expect(title).toHaveTextContent("2.1")
    expect(screen.getByText("1 out of 1 steps passed")).toBeInTheDocument()
    expect(screen.getByText("2 out of 3 points received")).toBeInTheDocument()
  })

  it("leaves the points out for a lesson without tests", async () => {
    renderPlayer(ids.courseStepText)
    await screen.findByText("1 out of 1 steps passed")
    expect(screen.queryByText(/points received/)).not.toBeInTheDocument()
  })
})

describe("step player: the step strip", () => {
  it("has a square per step with its type and state, and marks the open one", async () => {
    servesMixedStep()
    renderPlayer(ids.courseStepTest)
    const strip = await screen.findByRole("navigation", { name: "Steps of this lesson" })
    const squares = within(strip).getAllByRole("link")
    expect(squares.map((square) => square.getAttribute("aria-label"))).toEqual([
      "Step 1: reading, passed",
      "Step 2: quiz, not passed",
      "Step 3: flash cards, not passed",
    ])
    // The first step not passed (the quiz) opens when the address names no step.
    expect(squares.map((square) => square.getAttribute("aria-current"))).toEqual([null, "step", null])
    expect(squares.map((square) => square.dataset.passed)).toEqual(["true", "false", "false"])
    expect(await screen.findByTestId("best-result")).toHaveTextContent("Best result: 2/3")
  })

  it("opens the step named in the address and links the squares to their steps", async () => {
    servesMixedStep()
    renderPlayer(ids.courseStepTest, "learn", 1)
    expect(await screen.findByText("First read this.")).toBeInTheDocument()
    const strip = screen.getByRole("navigation", { name: "Steps of this lesson" })
    const squares = within(strip).getAllByRole("link")
    expect(squares[0]?.getAttribute("aria-current")).toBe("step")
    expect(squares[2]?.getAttribute("href")).toContain(`step=${ids.courseStepTest}&slug=${slug}&block=3`)
  })

  it("moves to the next step inside the lesson and to the next lesson after the last step", async () => {
    servesMixedStep()
    const { unmount } = renderPlayer(ids.courseStepTest, "learn", 1)
    const next = await screen.findByRole("link", { name: /Next step/ })
    expect(next.getAttribute("href")).toContain(`step=${ids.courseStepTest}&slug=${slug}&block=2`)
    expect(screen.queryByRole("link", { name: /^Previous/ })).toBeInTheDocument()
    unmount()

    renderPlayer(ids.courseStepTest, "learn", 3)
    const lesson = await screen.findByRole("link", { name: /Next lesson/ })
    expect(lesson.getAttribute("href")).toContain(`step=${ids.courseStepCards}&slug=${slug}`)
    expect(lesson.getAttribute("href")).not.toContain("block=")
  })

  it("finishes at the end of the course by going back to the course page", async () => {
    renderPlayer(ids.courseStepCards)
    const finish = await screen.findByRole("link", { name: /Finish/ })
    expect(finish.getAttribute("href")).toContain(`slug=${slug}`)
  })

  it("keeps a step from the address inside the lesson", async () => {
    servesMixedStep()
    renderPlayer(ids.courseStepTest, "learn", 99)
    const strip = await screen.findByRole("navigation", { name: "Steps of this lesson" })
    const squares = within(strip).getAllByRole("link")
    expect(squares[2]?.getAttribute("aria-current")).toBe("step")
  })
})

describe("step player: the course sidebar", () => {
  it("lists the numbered modules and lessons, marks the open lesson and shows the points progress", async () => {
    renderPlayer(ids.courseStepTest)
    const nav = await screen.findByRole("navigation", { name: "Course contents" })
    expect(within(nav).getByText("Introduction")).toBeInTheDocument()
    expect(within(nav).getByText("Rules and practice")).toBeInTheDocument()
    const current = within(nav).getByRole("link", { name: /Derivative rules quiz/ })
    expect(current.getAttribute("aria-current")).toBe("step")
    expect(current).toHaveTextContent("2.1")
    expect(
      within(nav)
        .getByRole("link", { name: /What is a derivative\?/ })
        .getAttribute("aria-current"),
    ).toBeNull()
    expect(within(nav).getByLabelText("Lesson completed")).toBeInTheDocument()
    expect(
      screen.getByRole("progressbar", { name: /Course progress: \d+\/\d+ lessons · 2\/3 points/ }),
    ).toBeInTheDocument()
    expect(screen.getByText("Derivatives 101")).toBeInTheDocument()
  })

  it("opens as a drawer on a phone", async () => {
    const { user } = renderPlayer(ids.courseStepText)
    await screen.findByRole("heading", { name: "What is a derivative?", level: 2 })
    await user.click(screen.getByRole("button", { name: "Open course contents" }))
    const drawer = await screen.findByRole("dialog")
    const nav = within(drawer).getByRole("navigation", { name: "Course contents" })
    expect(within(nav).getByRole("link", { name: /Key formulas/ })).toBeInTheDocument()
  })

  it("offers the way back to the course and to my courses from the settings menu", async () => {
    const { user } = renderPlayer(ids.courseStepText)
    await screen.findByRole("heading", { name: "What is a derivative?", level: 2 })
    await user.click(screen.getByRole("button", { name: "Settings" }))
    expect(await screen.findByRole("menuitem", { name: "Course page" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "My courses" })).toBeInTheDocument()
  })
})

describe("step player: tests", () => {
  it("never shows correctness before the attempt is submitted, then shows the review", async () => {
    startsAttemptWithoutDeadline()
    const { user } = renderPlayer(ids.courseStepTest)

    // The rules and the best result come first, with a way to start.
    expect(await screen.findByRole("heading", { name: /Derivative rules quiz/, level: 1 })).toBeInTheDocument()
    expect(screen.getByTestId("best-result")).toHaveTextContent("Best result: 2/3")
    await user.click(await screen.findByRole("button", { name: "Try again" }))

    // Open attempt: questions and options only.
    expect(await screen.findByText("What is the derivative of x^2?")).toBeInTheDocument()
    await user.click(screen.getByLabelText("2x"))
    await user.click(screen.getByLabelText("f(x) = 5"))
    const attempt = screen.getByRole("region", { name: "Attempt 1" })
    expect(within(attempt).queryByText(/correct|incorrect|explanation|passed/i)).not.toBeInTheDocument()
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

/** The labels over the four rating buttons, e.g. `<10m`. */
function intervalLabels(): (string | undefined)[] {
  return ["Again", "Hard", "Good", "Easy"].map((name) => {
    const button = screen.getByRole("button", { name })
    return document.getElementById(button.getAttribute("aria-describedby") ?? "")?.textContent
  })
}

describe("step player: flash cards (Anki's study screen)", () => {
  it("shows the question with the counts as new + learning + review and hides the answer", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/steps/:stepId/cards/next"), () =>
        HttpResponse.json({ ...lmsCardStudy, counts: { new: 3, learning: 2, review: 5 } }),
      ),
    )
    renderPlayer(ids.courseStepCards)

    expect(await screen.findByText("d/dx sin x")).toBeInTheDocument()
    expect(screen.getByTestId("study-counts")).toHaveTextContent("3+2+5")
    expect(screen.queryByText("cos x")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Easy" })).not.toBeInTheDocument()
  })

  it("reveals the answer and labels Again, Hard, Good and Easy with the next intervals", async () => {
    const { user } = renderPlayer(ids.courseStepCards)

    await user.click(await screen.findByRole("button", { name: "Show answer" }))

    expect(screen.getByTestId("card-back")).toHaveTextContent("cos x")
    expect(intervalLabels()).toEqual(["<10m", "1d", "3d", "7d"])
  })

  it("rates the card and loads the next one", async () => {
    let rating: unknown = null
    server.use(
      http.post(apiUrl("/v1/lms/steps/:stepId/cards/:cardId/review"), async ({ request }) => {
        rating = await readBody(request)
        return HttpResponse.json({
          ...lmsCardStudy,
          card: { id: "next-card", front: "d/dx cos x", back: "-sin x" },
          counts: { new: 3, learning: 1, review: 0 },
        })
      }),
    )
    const { user } = renderPlayer(ids.courseStepCards)
    await user.click(await screen.findByRole("button", { name: "Show answer" }))

    await user.click(screen.getByRole("button", { name: "Good" }))

    expect(await screen.findByText("d/dx cos x")).toBeInTheDocument()
    expect(rating).toEqual({ rating: "medium" })
    expect(screen.getByTestId("study-counts")).toHaveTextContent("3+1+0")
    expect(screen.queryByText("-sin x")).not.toBeInTheDocument()
  })

  it("answers with the keyboard: Space, then 1", async () => {
    const ratings: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/lms/steps/:stepId/cards/:cardId/review"), async ({ request }) => {
        ratings.push(((await readBody(request)) as { rating: string }).rating)
        return HttpResponse.json({ ...lmsCardStudy, card: null, intervals: null })
      }),
    )
    const { user } = renderPlayer(ids.courseStepCards)
    await screen.findByText("d/dx sin x")

    await user.keyboard(" ")
    await user.keyboard("1")

    await waitFor(() => expect(ratings).toEqual(["again"]))
  })

  it("comes back to the same card after Again and hides its answer again", async () => {
    server.use(http.post(apiUrl("/v1/lms/steps/:stepId/cards/:cardId/review"), () => HttpResponse.json(lmsCardStudy)))
    const { user } = renderPlayer(ids.courseStepCards)
    await user.click(await screen.findByRole("button", { name: "Show answer" }))

    await user.click(screen.getByRole("button", { name: "Again" }))

    await waitFor(() => expect(screen.queryByTestId("card-back")).not.toBeInTheDocument())
    expect(screen.getByText("d/dx sin x")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Show answer" })).toBeInTheDocument()
  })

  it("says the cards are done when none is left", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/steps/:stepId/cards/next"), () =>
        HttpResponse.json({ ...lmsCardStudy, card: null, intervals: null, counts: { new: 0, learning: 0, review: 0 } }),
      ),
    )
    renderPlayer(ids.courseStepCards)

    expect(await screen.findByText("Congratulations! You have finished this deck for now.")).toBeInTheDocument()
    expect(screen.getByTestId("study-counts")).toHaveTextContent("0+0+0")
  })

  it("shows the error of a failed rating and keeps the card", async () => {
    server.use(
      http.post(apiUrl("/v1/lms/steps/:stepId/cards/:cardId/review"), () =>
        problem(500, "internal-error", "Internal error"),
      ),
    )
    const { user } = renderPlayer(ids.courseStepCards)
    await user.click(await screen.findByRole("button", { name: "Show answer" }))

    await user.click(screen.getByRole("button", { name: "Easy" }))

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("d/dx sin x")).toBeInTheDocument()
  })

  it("only counts the cards to staff previewing a draft and never asks for the next card", async () => {
    let asked = false
    server.use(
      http.get(apiUrl("/v1/lms/courses/:id/preview/steps/:stepId"), () =>
        HttpResponse.json({ ...stepViewCards, preview: true }),
      ),
      http.get(apiUrl("/v1/lms/steps/:stepId/cards/next"), () => {
        asked = true
        return HttpResponse.json(lmsCardStudy)
      }),
    )
    renderPlayer(ids.courseStepCards, "preview")

    expect(await screen.findByText("4 cards")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show answer" })).not.toBeInTheDocument()
    expect(asked).toBe(false)
  })
})
