import { describe, expect, it } from "bun:test"
import { webResults } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../test-support"
import type { PendingTurn } from "./pending-turn"
import { StreamingAnswer } from "./streaming-answer"

allowSlowRenders()

const pending: PendingTurn = {
  id: 1,
  kind: "send",
  userText: "How do plants make sugar?",
  assistantText: "Plants turn light into sugar ⟦w1⟧ and then",
  citations: [],
  web: [],
  stopped: false,
  baselineSeq: 2,
  replaced: null,
}

describe("StreamingAnswer: web chips", () => {
  it("resolves a web marker as soon as the web event delivered the pages", () => {
    renderNotebook(<StreamingAnswer pending={{ ...pending, web: webResults }} running />)

    expect(screen.getByRole("link", { name: /Web source 1: Photosynthesis - Wikipedia/ })).toBeInTheDocument()
    expect(document.body.textContent).not.toContain("⟦")
  })

  it("shows no chip before the pages arrived", () => {
    renderNotebook(<StreamingAnswer pending={pending} running />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})

describe("AI-STEPS StreamingAnswer: steps", () => {
  it("names the running step above the growing answer", () => {
    renderNotebook(
      <StreamingAnswer
        pending={{ ...pending, steps: [{ id: "1", kind: "web_search", label: "Searched the web", status: "running" }] }}
        running
      />,
    )

    expect(screen.getByText("Searching the web…")).toBeInTheDocument()
  })
})
