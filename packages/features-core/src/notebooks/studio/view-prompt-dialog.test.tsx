import { describe, expect, it, mock } from "bun:test"
import type { ArtifactDetail, AssessmentBlueprint } from "@ihsp/api"
import { apiUrl, artifactDetailOf, artifactQuiz, nbIds, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { ViewPromptDialog } from "./view-prompt-dialog"

allowSlowRenders()

const blueprint: AssessmentBlueprint = {
  mode: "vocab_test",
  requested: 4,
  delivered: 3,
  rejected: 1,
  profiles: [
    {
      label: "S1",
      kind: "vocabulary_list",
      subject: "English vocabulary",
      domains: ["Biology"],
      item_pools: [],
      has_math: false,
      term_definition_pairs: true,
    },
  ],
  items: [
    {
      id: "b1",
      type: "single",
      template: "sentence_completion",
      domain: "Biology",
      difficulty: "easy",
      source: "S1",
      focus: "",
      stimulus: false,
    },
    {
      id: "b2",
      type: "single",
      template: "sentence_completion",
      domain: "Biology",
      difficulty: "medium",
      source: "S1",
      focus: "",
      stimulus: false,
    },
    {
      id: "b3",
      type: "single",
      template: "synonym",
      domain: "Ecology",
      difficulty: "hard",
      source: "S1",
      focus: "",
      stimulus: false,
    },
    {
      id: "b4",
      type: "single",
      template: "word_in_context",
      domain: "Ecology",
      difficulty: "hard",
      source: "S1",
      focus: "",
      stimulus: false,
    },
  ],
}

function quizWithBlueprint(content: "with" | "without"): ArtifactDetail {
  const detail = artifactDetailOf(artifactQuiz)
  if (detail.kind !== "quiz" || !detail.content) throw new Error("fixture is not a ready quiz")
  return content === "with" ? { ...detail, content: { ...detail.content, blueprint } } : detail
}

function renderPrompt(detail: ArtifactDetail) {
  server.use(
    http.get(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/${artifactQuiz.id}`), () => HttpResponse.json(detail)),
  )
  return renderNotebook(
    <ViewPromptDialog item={artifactQuiz} notebookId={nbIds.notebook} open onOpenChange={mock(() => undefined)} />,
  )
}

describe("ViewPromptDialog: the plan of a planned quiz", () => {
  it("shows the test type, the requested and delivered counts and the sources", async () => {
    renderPrompt(quizWithBlueprint("with"))

    const dialog = await screen.findByRole("dialog", { name: "Prompt" })
    const plan = await within(dialog).findByRole("region", { name: "Plan" })
    expect(within(plan).getByText("Vocabulary")).toBeInTheDocument()
    expect(within(plan).getByText("3 of 4 (1 rejected)")).toBeInTheDocument()
    expect(within(plan).getByText("Vocabulary list")).toBeInTheDocument()
  })

  it("counts the items per template and per domain", async () => {
    renderPrompt(quizWithBlueprint("with"))

    const plan = await screen.findByRole("region", { name: "Plan" })
    const template = within(plan).getByText("sentence completion").closest("li")
    expect(template).toHaveTextContent("2")
    expect(within(plan).getByText("synonym").closest("li")).toHaveTextContent("1")
    expect(within(plan).getByText("Ecology").closest("li")).toHaveTextContent("2")
  })

  it("shows no plan for a quiz made before plans were stored", async () => {
    renderPrompt(quizWithBlueprint("without"))

    const dialog = await screen.findByRole("dialog", { name: "Prompt" })
    await within(dialog).findByText("Only the Calvin cycle")
    expect(within(dialog).queryByRole("region", { name: "Plan" })).toBeNull()
  })
})
