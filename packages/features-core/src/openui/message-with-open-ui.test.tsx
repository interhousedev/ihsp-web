import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { chatLibrary, studioLibrary } from "./library"
import { MessageWithOpenUi } from "./message-with-open-ui"

const md = (text: string) => <p data-testid="md">{text}</p>
const wrap = (code: string) => `Intro\n\n\`\`\`openui\n${code}\n\`\`\`\n\nOutro`

function show(text: string, library = chatLibrary, isStreaming = false) {
  return renderWithProviders(
    <MessageWithOpenUi text={text} library={library} isStreaming={isStreaming} renderMarkdown={md} />,
  )
}

describe("OPENUI-4 MessageWithOpenUi", () => {
  it("passes a message without a block to the markdown renderer unchanged", () => {
    show("plain **text**")
    expect(screen.getByTestId("md")).toHaveTextContent("plain **text**")
  })

  it("renders a Table block", () => {
    show(wrap('root = Stack([t])\nt = Table(["Subject", "Mark"], [["Math", 5], ["Art", "4"]], "Marks")'))
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getAllByText("Math").length).toBeGreaterThan(0)
    expect(screen.getAllByTestId("md")).toHaveLength(2)
  })

  it("renders a StatGrid block", () => {
    show(wrap('root = Stack([StatGrid([{label: "Average", value: 4.5}])])'))
    expect(screen.getByText("Average")).toBeInTheDocument()
    expect(screen.getByText("4.5")).toBeInTheDocument()
  })

  it("falls back to readable text for an unknown component", () => {
    show(wrap('root = Stack([Evil("Visible words")])'))
    expect(screen.getByRole("note")).toHaveTextContent("Could not show this block")
    expect(screen.getByText("Visible words")).toBeInTheDocument()
    expect(screen.queryByText(/root = /)).toBeNull()
  })

  it("falls back when a required prop is missing", () => {
    show(wrap("root = Stack([Table()])"))
    expect(screen.getByRole("note")).toBeInTheDocument()
  })

  it("does not render a block with a javascript: link; it degrades to its readable text", () => {
    // The backend drops such a block before it is stored (corpus.json: javascript_link), so the web does not render it.
    show(
      wrap(
        'root = Stack([LinkList([{title: "Bad", url: "javascript:alert(1)"}, {title: "Good", url: "https://example.com/a"}])])',
      ),
    )
    expect(screen.queryByRole("link")).toBeNull()
    expect(screen.getByRole("note")).toHaveTextContent("Bad")
    expect(screen.getByRole("note")).toHaveTextContent("Good")
  })

  it("shows a skeleton for an unclosed block", () => {
    show("Intro\n```openui\nroot = Stack([Tab", chatLibrary, true)
    expect(screen.getByRole("status", { name: "Preparing the block" })).toBeInTheDocument()
    expect(screen.queryByText(/root =/)).toBeNull()
  })

  it("shows a skeleton, not the error fallback, for a closed invalid block while streaming", () => {
    // The backend repairs or drops invalid blocks only when the answer finishes; until then the block waits.
    show(wrap('root = Stack([Evil("Visible words")])'), chatLibrary, true)
    expect(screen.getByRole("status", { name: "Preparing the block" })).toBeInTheDocument()
    expect(screen.queryByRole("note")).toBeNull()
    expect(screen.queryByText("Visible words")).toBeNull()
  })

  it("studio library renders only studio components", () => {
    show(wrap('root = Stack([Progress("x", 1, 2)])'), studioLibrary)
    expect(screen.getByRole("note")).toBeInTheDocument()
  })
})
