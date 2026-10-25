import { afterEach, describe, expect, it } from "bun:test"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { useState } from "react"
import { renderLibrary } from "../test-support"
import { MarkdownEditor } from "./markdown-editor"

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return <MarkdownEditor value={value} onChange={setValue} label="Note text" />
}

const field = () => screen.getByRole("textbox", { name: "Note text" }) as HTMLTextAreaElement

describe("MarkdownEditor", () => {
  afterEach(() => {
    window.innerWidth = 1280
  })

  it("wraps the selected text when a toolbar button is pressed", async () => {
    const { user } = renderLibrary(<Harness initial="one two three" />)
    field().setSelectionRange(4, 7)

    await user.click(screen.getByRole("button", { name: "Bold" }))

    expect(field().value).toBe("one **two** three")
    await waitFor(() => expect(field().selectionStart).toBe(6))
    expect(field().selectionEnd).toBe(9)
  })

  it("has a toolbar with a formula in a line and in a block", () => {
    renderLibrary(<Harness />)

    const toolbar = screen.getByRole("toolbar", { name: "Formatting" })
    for (const name of ["Bold", "Italic", "Heading", "Bulleted list", "Formula in a line", "Formula in a block"]) {
      expect(within(toolbar).getByRole("button", { name })).toBeInTheDocument()
    }
  })

  it("inserts a formula placeholder that is selected for typing", async () => {
    const { user } = renderLibrary(<Harness />)

    await user.click(screen.getByRole("button", { name: "Formula in a line" }))

    expect(field().value).toBe("$x^2$")
    await waitFor(() => expect(field().value.slice(field().selectionStart, field().selectionEnd)).toBe("x^2"))
  })

  it("makes the selection bold with Ctrl+B", () => {
    renderLibrary(<Harness initial="word" />)
    field().setSelectionRange(0, 4)

    fireEvent.keyDown(field(), { key: "b", ctrlKey: true })

    expect(field().value).toBe("**word**")
  })

  it("shows a live preview with Markdown and a formula", async () => {
    const { user } = renderLibrary(<Harness />)

    await user.type(field(), "## Speed{enter}$v = s / t$")

    const preview = screen.getByRole("region", { name: "Preview of the note" })
    expect(within(preview).getByRole("heading", { name: "Speed" })).toBeInTheDocument()
    await waitFor(() => expect(preview.querySelector(".katex")).not.toBeNull())
  })

  it("says so when there is nothing to preview", () => {
    renderLibrary(<Harness />)

    expect(screen.getByText("Nothing to preview yet.")).toBeInTheDocument()
  })

  it("switches between Write and Preview on a phone", async () => {
    window.innerWidth = 390
    const { user } = renderLibrary(<Harness initial="**hi**" />)
    expect(screen.queryByRole("region", { name: "Preview of the note" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Preview" }))

    expect(screen.getByRole("region", { name: "Preview of the note" })).toBeInTheDocument()
    expect(screen.queryByRole("textbox", { name: "Note text" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bold" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Write" }))
    expect(field()).toBeInTheDocument()
  })
})
