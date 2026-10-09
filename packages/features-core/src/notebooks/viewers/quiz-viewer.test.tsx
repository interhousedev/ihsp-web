import { describe, expect, it } from "bun:test"
import type { ArtifactDetail } from "@ihsp/api"
import { apiUrl, artifactDetailOf, artifactQuiz, nbIds, notebookTurn, passageId, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { QuizViewer } from "./quiz-viewer"

allowSlowRenders()

type QuizArtifact = Extract<ArtifactDetail, { kind: "quiz" }>

function quizArtifact(extra: Partial<QuizArtifact> = {}): QuizArtifact {
  const detail = artifactDetailOf(artifactQuiz)
  if (detail.kind !== "quiz") throw new Error("fixture is not a quiz")
  return { ...detail, ...extra }
}

function renderQuiz(extra: Partial<QuizArtifact> = {}, locale: "en" | "ru" | "uz" = "en") {
  return renderNotebook(<QuizViewer notebookId={nbIds.notebook} artifact={quizArtifact(extra)} />, { locale })
}

const progressUrl = apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/${artifactQuiz.id}/progress`)

function recordProgress() {
  const bodies: { state: Record<string, unknown> }[] = []
  server.use(
    http.put(progressUrl, async ({ request }) => {
      bodies.push((await request.json()) as { state: Record<string, unknown> })
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return bodies
}

/** The card of a result figure ("Score", "Correct", ...). */
const stat = (label: string) => within(screen.getByRole("status")).getByText(label).closest("div")

const option = (name: RegExp | string) => screen.getByRole("radio", { name })

/** Plays the whole fixture: q1 right, q2 (multiple) wrong, q3 skipped, q4 right. Ends on the results. */
async function playAll(user: UserEvent) {
  await user.click(option(/Oxygen/))
  await user.click(screen.getByRole("button", { name: "Next" }))
  await user.click(screen.getByRole("checkbox", { name: /Light intensity/ }))
  await user.click(screen.getByRole("checkbox", { name: /CO2 concentration/ }))
  await user.click(screen.getByRole("button", { name: "Check" }))
  await user.click(screen.getByRole("button", { name: "Next" }))
  await user.click(screen.getByRole("button", { name: "Skip" }))
  await user.click(option(/Carbon dioxide/))
  await user.click(screen.getByRole("button", { name: "See results" }))
}

describe("QuizViewer: a question", () => {
  it("shows one question with its progress and the options as a radio group", () => {
    renderQuiz()

    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Question 1 of 4" })).toHaveAttribute("aria-valuenow", "1")
    const group = screen.getByRole("radiogroup", { name: "Which gas is released in the light reactions?" })
    expect(within(group).getAllByRole("radio")).toHaveLength(4)
    expect(screen.queryByRole("button", { name: "Check" })).not.toBeInTheDocument()
  })

  it("gives instant feedback for a right answer, with the explanation", async () => {
    const { user } = renderQuiz()

    await user.click(option(/Oxygen/))

    const feedback = screen.getByRole("status")
    expect(within(feedback).getByText("Correct")).toBeInTheDocument()
    expect(within(feedback).getByText(/Water is split and oxygen is released/)).toBeInTheDocument()
    expect(within(feedback).getByRole("button", { name: "Explain" })).toBeInTheDocument()
    expect(option(/Oxygen/)).toHaveAttribute("aria-checked", "true")
    expect(option(/Oxygen/)).toHaveTextContent("Correct answer")
  })

  it("marks a wrong answer and shows the right one, with words and not only colours", async () => {
    const { user } = renderQuiz()

    await user.click(option(/Nitrogen/))

    expect(within(screen.getByRole("status")).getByText("Incorrect")).toBeInTheDocument()
    expect(within(screen.getByRole("status")).getByText(/oxygen is released/)).toBeInTheDocument()
    expect(option(/Nitrogen/)).toHaveTextContent("Your answer")
    expect(option(/Nitrogen/)).toHaveTextContent("Incorrect")
    expect(option(/Oxygen/)).toHaveTextContent("Correct answer")
    expect(option(/Hydrogen/)).not.toHaveTextContent("Correct answer")
  })

  it("keeps a checked answer final", async () => {
    const { user } = renderQuiz()
    await user.click(option(/Nitrogen/))

    await user.click(option(/Oxygen/))

    expect(option(/Nitrogen/)).toHaveAttribute("aria-checked", "true")
    expect(option(/Oxygen/)).toHaveAttribute("aria-checked", "false")
  })

  it("moves the focus with the arrow keys and chooses with Space", async () => {
    const { user } = renderQuiz()
    option(/Oxygen/).focus()

    await user.keyboard("{ArrowDown}")
    expect(option(/Carbon dioxide/)).toHaveFocus()
    expect(screen.getByRole("status")).toBeEmptyDOMElement()

    await user.keyboard(" ")
    expect(option(/Carbon dioxide/)).toHaveAttribute("aria-checked", "true")
  })

  it("asks to choose all that apply and needs Check for a multiple-choice question", async () => {
    const { user } = renderQuiz({ progress_state: { answers: {}, current: 1, submitted: false } })

    expect(screen.getByText("Choose all that apply")).toBeInTheDocument()
    expect(screen.getByRole("group", { name: /limit the rate/ })).toHaveAccessibleDescription("Choose all that apply")
    const check = screen.getByRole("button", { name: "Check" })
    expect(check).toBeDisabled()

    for (const name of [/Light intensity/, /CO2 concentration/, /Temperature/]) {
      await user.click(screen.getByRole("checkbox", { name }))
    }
    expect(screen.getByRole("status")).toBeEmptyDOMElement()
    await user.click(check)

    expect(within(screen.getByRole("status")).getByText("Correct")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Check" })).not.toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: /Soil colour/ })).not.toBeChecked()
  })

  it("marks a partly right multiple-choice answer as incorrect", async () => {
    const { user } = renderQuiz({ progress_state: { answers: {}, current: 1, submitted: false } })

    await user.click(screen.getByRole("checkbox", { name: /Light intensity/ }))
    await user.click(screen.getByRole("button", { name: "Check" }))

    expect(within(screen.getByRole("status")).getByText("Incorrect")).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: /Temperature/ })).toHaveAccessibleName(/Correct answer/)
  })

  it("shows true and false with the localized labels", () => {
    renderQuiz({ progress_state: { answers: {}, current: 2, submitted: false } }, "ru")

    expect(screen.getByRole("radio", { name: "Верно" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Неверно" })).toBeInTheDocument()
  })

  it("reveals the hint once, and only for a question that has one", async () => {
    const { user } = renderQuiz()

    await user.click(screen.getByRole("button", { name: "Hint" }))
    expect(screen.getByText("Water is split.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Hint" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.queryByRole("button", { name: "Hint" })).not.toBeInTheDocument()
  })

  it("skips a question and can go back to it", async () => {
    const { user } = renderQuiz()

    await user.click(screen.getByRole("button", { name: "Skip" }))
    expect(screen.getByText("Question 2 of 4")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument()
    expect(screen.getByRole("status")).toBeEmptyDOMElement()
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()
  })
})

describe("QuizViewer: results", () => {
  it("shows the score, accuracy and counts after the last question", async () => {
    const { user } = renderQuiz()

    await playAll(user)

    const results = screen.getByRole("status")
    expect(within(results).getByRole("heading", { name: "Results" })).toBeInTheDocument()
    expect(stat("Score")).toHaveTextContent("50%")
    expect(stat("Accuracy")).toHaveTextContent("67%")
    expect(stat("Correct")).toHaveTextContent("2")
    expect(stat("Incorrect")).toHaveTextContent("1")
    expect(stat("Skipped")).toHaveTextContent("1")
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
  })

  it("reviews the answers with the right options and the explanations", async () => {
    const { user } = renderQuiz()
    await playAll(user)

    await user.click(screen.getByRole("button", { name: "Review answers" }))

    const items = screen.getAllByRole("listitem").filter((item) => item.querySelector("h4"))
    expect(items).toHaveLength(4)
    expect(within(items[1]!).getByText("Incorrect")).toBeInTheDocument()
    expect(within(items[1]!).getByText(/Light, CO2 and temperature all limit the rate/)).toBeInTheDocument()
    expect(within(items[1]!).getByText("Temperature").closest("li")).toHaveTextContent("Correct answer")
    expect(within(items[2]!).getByText("Skipped")).toBeInTheDocument()
    expect(within(items[3]!).getByText("Correct")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Back to results" }))
    expect(screen.getByRole("heading", { name: "Results" })).toBeInTheDocument()
  })

  it("retries only the wrong answers, then everything", async () => {
    const { user } = renderQuiz()
    await playAll(user)

    await user.click(screen.getByRole("button", { name: "Retry wrong answers" }))

    expect(screen.getByText("Question 1 of 1")).toBeInTheDocument()
    expect(screen.getByRole("group", { name: /limit the rate/ })).toBeInTheDocument()
    await user.click(screen.getByRole("checkbox", { name: /Light intensity/ }))
    await user.click(screen.getByRole("checkbox", { name: /CO2 concentration/ }))
    await user.click(screen.getByRole("checkbox", { name: /Temperature/ }))
    await user.click(screen.getByRole("button", { name: "Check" }))
    await user.click(screen.getByRole("button", { name: "See results" }))
    expect(stat("Score")).toHaveTextContent("100%")
    expect(screen.getByRole("button", { name: "Retry wrong answers" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument()
    expect(screen.getByRole("status")).toBeEmptyDOMElement()
  })

  it("disables Retry wrong answers when nothing was wrong", async () => {
    const { user } = renderQuiz({
      progress_state: {
        answers: { q1: ["a"], q2: ["a", "b", "c"], q3: ["false"], q4: ["b"] },
        current: 3,
        submitted: true,
      },
    })

    expect(screen.getByRole("button", { name: "Retry wrong answers" })).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Review answers" }))
    expect(screen.getAllByText("Correct").length).toBeGreaterThanOrEqual(4)
  })
})

describe("QuizViewer: progress", () => {
  it("saves the answers and the position", async () => {
    const bodies = recordProgress()
    const { user } = renderQuiz()

    await user.click(option(/Oxygen/))
    await user.click(screen.getByRole("button", { name: "Next" }))

    await waitFor(() => expect(bodies).toHaveLength(1), { timeout: 3000 })
    expect(bodies[0]).toEqual({ state: { answers: { q1: ["a"] }, current: 1, submitted: false } })
  })

  it("saves the finished quiz when the viewer closes", async () => {
    const bodies = recordProgress()
    const { user, unmount } = renderQuiz()
    await playAll(user)

    unmount()

    await waitFor(() => expect(bodies.length).toBeGreaterThan(0), { timeout: 300, interval: 20 })
    expect(bodies.at(-1)?.state).toEqual({
      answers: { q1: ["a"], q2: ["a", "b"], q4: ["b"] },
      current: 3,
      submitted: true,
    })
  })

  it("resumes with the saved answers and position", () => {
    renderQuiz({ progress_state: { answers: { q1: ["b"] }, current: 0, submitted: false } })

    expect(option(/Carbon dioxide/)).toHaveAttribute("aria-checked", "true")
    expect(within(screen.getByRole("status")).getByText("Incorrect")).toBeInTheDocument()
  })

  it("starts fresh when the saved progress has an unknown shape", () => {
    renderQuiz({ progress_state: { known: ["c1"], position: 4 } })

    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument()
  })
})

describe("QuizViewer: Explain", () => {
  it("asks the notebook chat with an anchor on the question's passages", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/chat/messages`), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(notebookTurn("explain"))
      }),
    )
    const { user } = renderQuiz()
    await user.click(option(/Nitrogen/))

    await user.click(screen.getByRole("button", { name: "Explain" }))

    const panel = await screen.findByRole("dialog")
    expect(await within(panel).findByText(/The Calvin cycle builds sugar/)).toBeInTheDocument()
    expect(bodies).toEqual([
      {
        text: "Explain this quiz question and its answer in more detail using my sources: Which gas is released in the light reactions?",
        anchor: { kind: "passages", ids: [passageId(1, 3)] },
      },
    ])
  })
})
