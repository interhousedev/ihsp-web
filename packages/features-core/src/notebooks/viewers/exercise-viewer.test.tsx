import { describe, expect, it } from "bun:test"
import type { ArtifactDetail } from "@ihsp/api"
import { apiUrl, artifactDetailOf, artifactExercise, nbIds, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { ExerciseViewer } from "./exercise-viewer"

allowSlowRenders()

type ExerciseArtifact = Extract<ArtifactDetail, { kind: "exercise" }>

function exerciseArtifact(extra: Partial<ExerciseArtifact> = {}): ExerciseArtifact {
  const detail = artifactDetailOf(artifactExercise)
  if (detail.kind !== "exercise") throw new Error("fixture is not an exercise")
  return { ...detail, ...extra }
}

function renderExercise(extra: Partial<ExerciseArtifact> = {}, locale: "en" | "ru" | "uz" = "en") {
  return renderNotebook(<ExerciseViewer notebookId={nbIds.notebook} artifact={exerciseArtifact(extra)} />, { locale })
}

const base = `/v1/notebooks/${nbIds.notebook}/artifacts/${artifactExercise.id}`
const ESSAY = "Plants matter because they make oxygen and food for every animal on the planet, so I agree."

describe("ExerciseViewer", () => {
  it("shows the passage and an input per question type", () => {
    renderExercise()
    expect(screen.getByText(/Plants turn sunlight/)).toBeTruthy()
    expect(screen.getByRole("radio", { name: /In the leaves/ })).toBeTruthy()
    expect(screen.getByRole("checkbox", { name: /Oxygen/ })).toBeTruthy()
    expect(screen.getByRole("radio", { name: "Not Given" })).toBeTruthy()
    expect(screen.getAllByRole("combobox")).toHaveLength(2)
    expect(screen.getByText("No more than 1 words")).toBeTruthy()
    expect(screen.getByRole("textbox", { name: "Your essay" })).toBeTruthy()
    expect(screen.getByRole("timer").textContent).toBe("40:00 left")
  })

  it("grades the objective questions on submit and saves the progress", async () => {
    const bodies: { state: Record<string, unknown> }[] = []
    server.use(
      http.put(apiUrl(`${base}/progress`), async ({ request }) => {
        bodies.push((await request.json()) as { state: Record<string, unknown> })
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderExercise()
    await user.click(screen.getByRole("radio", { name: /In the leaves/ }))
    await user.click(screen.getByRole("radio", { name: "Not Given" }))
    const [first, second] = screen.getAllByRole("combobox")
    if (!first || !second) throw new Error("no selects")
    await user.selectOptions(first, "B")
    await user.selectOptions(second, "A")
    const [gap, short] = screen.getAllByRole("textbox", { name: "Your answer" })
    if (!gap || !short) throw new Error("no text inputs")
    await user.type(gap, "Starch")
    await user.type(short, "carbon")
    await user.click(screen.getByRole("button", { name: "Submit answers" }))

    expect(screen.getByText("Score: 5 of 7")).toBeTruthy()
    expect(screen.getByText("Paragraph A says the leaves.")).toBeTruthy()
    expect(screen.getByText("Correct answer: oxygen / O2")).toBeTruthy()
    expect(screen.getByText("Rubric")).toBeTruthy()
    await waitFor(() => expect(bodies.at(-1)?.state.submitted).toBe(true))
  })

  it("asks for AI feedback on the essay only when the student clicks", async () => {
    let calls = 0
    server.use(
      http.post(apiUrl(`${base}/exercise-feedback`), () => {
        calls += 1
        return HttpResponse.json({
          overall: "Good start.",
          estimated_band: "6.5",
          criteria: [{ name: "Task Response (TR)", band: "6", comment: "Clear view." }],
          strengths: ["Clear position"],
          improvements: ["More examples"],
        })
      }),
    )
    const { user } = renderExercise({ progress_state: { answers: { q7: ESSAY }, submitted: true } })
    expect(calls).toBe(0)
    await user.click(screen.getByRole("button", { name: "Get AI feedback" }))
    expect(await screen.findByText("Estimated band: 6.5")).toBeTruthy()
    expect(screen.getByText("More examples")).toBeTruthy()
    expect(calls).toBe(1)
  })

  it("shows a refused feedback request as an error", async () => {
    server.use(
      http.post(apiUrl(`${base}/exercise-feedback`), () =>
        HttpResponse.json(
          { type: "https://errors.ihsp/notebooks/limit-reached", title: "Limit", status: 429 },
          { status: 429, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderExercise({ progress_state: { answers: { q7: ESSAY }, submitted: true } })
    await user.click(screen.getByRole("button", { name: "Get AI feedback" }))
    expect(await screen.findByRole("alert")).toBeTruthy()
  })

  it("is translated", () => {
    renderExercise({}, "ru")
    expect(screen.getByRole("button", { name: "Отправить ответы" })).toBeTruthy()
    expect(screen.getByRole("radio", { name: "Нет информации" })).toBeTruthy()
  })
})
