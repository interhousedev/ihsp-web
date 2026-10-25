import { describe, expect, it, mock } from "bun:test"
import type { ChatMessageView } from "@ihsp/api"
import { chatHomework, messageAssistantWeb, toolCallLookup, toolCallPending, webResults } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { AssistantMessage } from "./assistant-message"

allowSlowRenders()

function renderMessage(message: ChatMessageView) {
  return renderNotebook(
    <AssistantMessage
      chat={chatHomework}
      message={message}
      isLast
      hiddenCallIds={new Set()}
      rating={undefined}
      busy={false}
      actions={{ shareChat: mock(() => undefined) }}
      onApprove={mock(() => undefined)}
      onReject={mock(() => undefined)}
      onRate={mock(() => undefined)}
      onRegenerate={mock(() => undefined)}
    />,
    { route: "/assistant/" },
  )
}

describe("AssistantMessage: web answers", () => {
  it("renders a web chip instead of the raw marker, without any notebook around it", () => {
    renderMessage(messageAssistantWeb)

    const chip = screen.getByRole("link", { name: "Web source 1: Photosynthesis - Wikipedia" })
    expect(within(chip).getByText("uz.wikipedia.org")).toBeInTheDocument()
    expect(screen.getByText(/Plants turn light into sugar/)).toBeInTheDocument()
    expect(document.body.textContent).not.toContain("⟦")
  })

  it("renders a grouped marker as one chip and ignores source markers and unknown pages", () => {
    renderMessage({ ...messageAssistantWeb, text: "A ⟦w1,2⟧ B ⟦3⟧ C ⟦w9⟧ D." })

    expect(screen.getAllByRole("link", { name: /Web source 1/ })).toHaveLength(1)
    expect(screen.getByText("+1")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Source 3/ })).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain("⟦")
  })

  it("puts a collapsed Sources row between the answer and its actions", () => {
    renderMessage(messageAssistantWeb)

    const row = screen.getByRole("button", { name: /Sources · 2/ })
    expect(row).toHaveAttribute("aria-expanded", "false")
    const actions = screen.getByRole("group", { name: "Answer actions" })
    const text = screen.getByText(/Plants turn light into sugar/)
    expect(text.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(row.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("lists the cited pages first when the Sources row opens", async () => {
    const swapped = [
      { ...webResults[0]!, cited: false },
      { ...webResults[1]!, cited: true },
    ]
    const { user } = renderMessage({ ...messageAssistantWeb, text: "Light into sugar ⟦w2⟧.", web: swapped })

    await user.click(screen.getByRole("button", { name: /Sources · 2/ }))

    const links = within(screen.getByRole("list", { name: "Web pages used for this answer" })).getAllByRole("link")
    expect(links.map((link) => link.textContent)).toEqual([
      "The Calvin cycle (Khan Academy)",
      "Photosynthesis - Wikipedia",
    ])
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer nofollow")
  })

  it("has no Sources row for an answer without web pages", () => {
    renderMessage({ ...messageAssistantWeb, text: "Plain answer.", web: [] })

    expect(screen.queryByRole("button", { name: /Sources ·/ })).not.toBeInTheDocument()
    expect(screen.getByText("Plain answer.")).toBeInTheDocument()
  })

  it("copies the answer with [w1] brackets and the URLs of the cited pages", async () => {
    const { user } = renderMessage(messageAssistantWeb)

    await user.click(screen.getByRole("button", { name: "Copy" }))

    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toBe(
        "Plants turn light into sugar [w1]. The second stage happens in the stroma.\n\nSources:\n[w1] https://uz.wikipedia.org/wiki/Fotosintez",
      ),
    )
  })
})

describe("AI-STEPS AssistantMessage: steps", () => {
  it("shows the stored steps collapsed above the answer text", () => {
    renderMessage({
      ...messageAssistantWeb,
      steps: [{ id: "s1", kind: "web_search", label: "Searched the web", status: "done", duration_ms: 900 }],
    })

    const toggle = screen.getByRole("button", { name: "Show the steps of this answer" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    const text = screen.getByText(/Plants turn light into sugar/)
    expect(toggle.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe("AssistantMessage: steps and progress notes", () => {
  const step = { id: "s1", kind: "tool", label: "get_timetable", status: "done", duration_ms: 10 } as const

  it("shows read tools only as the collapsed steps row, not as a list of notes", () => {
    renderMessage({ ...messageAssistantWeb, tool_calls: [toolCallLookup], steps: [step] })

    expect(screen.getByRole("button", { name: "Show the steps of this answer" })).toHaveTextContent("1 step")
    expect(screen.queryByText("Looked up your timetable")).not.toBeInTheDocument()
  })

  it("never shows the note of a round that waits for approval as the answer", () => {
    const note = "I'll save the set in Russian. First I'll check…"
    renderMessage({ ...messageAssistantWeb, web: [], text: note, tool_calls: [toolCallPending] })

    expect(screen.queryByText(note)).not.toBeInTheDocument()
    expect(screen.getByText("Create flash card set")).toBeInTheDocument()
  })
})
