import { describe, expect, it, mock } from "bun:test"
import { nbIds, nbMessageAssistant, nbMessageAssistantWeb } from "@ihsp/test-utils"
import type { NotebookMessage as Message } from "@ihsp/api"
import { screen, waitFor } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { NotebookMessage } from "./notebook-message"

allowSlowRenders()

function renderMessage(message: Message, latest = false) {
  return renderNotebook(
    <NotebookMessage
      notebookId={nbIds.notebook}
      message={message}
      latest={latest}
      canAsk
      action={null}
      onAsk={mock(() => undefined)}
      onRegenerate={mock(() => undefined)}
      onDismissAction={mock(() => undefined)}
    />,
  )
}

describe("NotebookMessage: web answers", () => {
  it("shows a source chip and a web chip, never the raw markers", () => {
    renderMessage(nbMessageAssistantWeb)

    expect(screen.getByRole("button", { name: /Source 2: Lesson 5/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Web source 1: Photosynthesis - Wikipedia/ })).toBeInTheDocument()
    expect(document.body.textContent).not.toContain("⟦")
  })

  it("explains the two kinds of chips in a muted legend when both are present", () => {
    renderMessage(nbMessageAssistantWeb)

    expect(screen.getByText("① your sources · 🌐 web pages")).toBeInTheDocument()
  })

  it("shows no legend when only web chips are present", () => {
    renderMessage({ ...nbMessageAssistantWeb, text: "Plants turn light into sugar ⟦w1⟧.", citations: [] })

    expect(screen.queryByText(/your sources/)).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Web source 1/ })).toBeInTheDocument()
  })

  it("shows no legend when only source chips are present", () => {
    renderMessage({ ...nbMessageAssistantWeb, text: "The Calvin cycle builds sugar ⟦2⟧." })

    expect(screen.queryByText(/your sources/)).not.toBeInTheDocument()
  })

  it("puts the Sources row between the answer and its actions and lists the pages when opened", async () => {
    const { user } = renderMessage(nbMessageAssistantWeb)

    const row = screen.getByRole("button", { name: /Sources · 2/ })
    const actions = screen.getByRole("group", { name: "Answer actions" })
    expect(row.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    await user.click(row)

    expect(screen.getByRole("link", { name: "The Calvin cycle (Khan Academy)" })).toBeInTheDocument()
  })

  it("has no Sources row and no legend for an answer without web pages", () => {
    renderMessage(nbMessageAssistant)

    expect(screen.queryByRole("button", { name: /Sources ·/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/web pages/)).not.toBeInTheDocument()
  })

  it("does not warn about missing citations when the answer cites web pages", () => {
    renderMessage({ ...nbMessageAssistantWeb, grounded: false, citations: [], text: "Light into sugar ⟦w1⟧." })

    expect(screen.queryByText(/has no citations/)).not.toBeInTheDocument()
  })

  it("copies the answer with bracket markers and the cited URLs", async () => {
    const { user } = renderMessage(nbMessageAssistantWeb)

    await user.click(screen.getByRole("button", { name: "Copy" }))

    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toBe(
        "The Calvin cycle builds sugar from carbon dioxide [2]. Plants also turn light into sugar [w1].\n\nSources:\n[w1] https://uz.wikipedia.org/wiki/Fotosintez",
      ),
    )
  })
})
