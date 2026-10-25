/** The broadcast text editor: one tab stop for the toolbar, arrow keys inside it, Ctrl+B/I/U in the text field. */
import { describe, expect, test } from "bun:test"
import { fireEvent, screen } from "@testing-library/react"
import { useState } from "react"
import { TextEditor } from "../features/broadcasts/components/text-editor"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return <TextEditor id="text" value={value} onChange={setValue} />
}

describe("broadcast text editor", () => {
  test("the toolbar buttons announce their shortcuts and only one of them is in the tab order", () => {
    renderAdmin(<Harness />)

    const bold = screen.getByRole("button", { name: "Bold" })
    expect(bold).toHaveAttribute("aria-keyshortcuts", "Control+B Meta+B")
    expect(bold).toHaveAttribute("tabindex", "0")
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("tabindex", "-1")
    expect(screen.getByRole("button", { name: "Link" })).toHaveAttribute("aria-keyshortcuts", "Control+K Meta+K")
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeInTheDocument()
  })

  test("the arrow keys move the focus between the toolbar buttons", async () => {
    const { user } = renderAdmin(<Harness />)

    const bold = screen.getByRole("button", { name: "Bold" })
    bold.focus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus()
    await user.keyboard("{End}")
    expect(screen.getByRole("button", { name: "Link" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(bold).toHaveFocus()
    expect(screen.getByRole("button", { name: "Link" })).toHaveAttribute("tabindex", "-1")
  })

  test("Ctrl+B in the text field wraps the selection in <b>", () => {
    renderAdmin(<Harness initial="hello world" />)

    const area = screen.getByRole("textbox") as HTMLTextAreaElement
    area.focus()
    area.setSelectionRange(0, 5)
    fireEvent.keyDown(area, { key: "b", ctrlKey: true })

    expect(area).toHaveValue("<b>hello</b> world")
  })
})
