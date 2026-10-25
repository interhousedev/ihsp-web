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

  it("does not render a javascript: link as an anchor", () => {
    show(
      wrap(
        'root = Stack([LinkList([{title: "Bad", url: "javascript:alert(1)"}, {title: "Good", url: "https://example.com/a"}])])',
      ),
    )
    expect(screen.queryByRole("link", { name: "Bad" })).toBeNull()
    expect(screen.getByText("Bad")).toBeInTheDocument()
    const good = screen.getByRole("link", { name: "Good" })
    expect(good).toHaveAttribute("target", "_blank")
    expect(good).toHaveAttribute("rel", "noopener noreferrer nofollow")
  })

  it("shows a skeleton for an unclosed block", () => {
    show("Intro\n```openui\nroot = Stack([Tab", chatLibrary, true)
    expect(screen.getByRole("status", { name: "Preparing the block" })).toBeInTheDocument()
    expect(screen.queryByText(/root =/)).toBeNull()
  })

  it("studio library renders only studio components", () => {
    show(wrap('root = Stack([Progress("x", 1, 2)])'), studioLibrary)
    expect(screen.getByRole("note")).toBeInTheDocument()
  })
})
