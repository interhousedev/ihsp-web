import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { loadKatex } from "@ihsp/ui"
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { useState } from "react"
import { MarkdownEditor } from "../features/step-editor/components/markdown-editor"
import { renderLms } from "./helpers"

setDefaultTimeout(60_000)

function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)
  return <MarkdownEditor value={value} onChange={setValue} label="Markdown of block 1" />
}

async function renderEditor(initial = "") {
  await loadKatex()
  const result = renderLms(<Harness initial={initial} />)
  const textarea = screen.getByLabelText("Markdown of block 1") as HTMLTextAreaElement
  return { ...result, textarea }
}

/** Focuses the text and selects `[start, end)`, as a mouse or Shift+arrows would. */
function select(textarea: HTMLTextAreaElement, start: number, end = start) {
  act(() => {
    textarea.focus()
    textarea.setSelectionRange(start, end)
    fireEvent.select(textarea)
  })
}

function selectText(textarea: HTMLTextAreaElement, text: string) {
  const start = textarea.value.indexOf(text)
  select(textarea, start, start + text.length)
}

describe("markdown editor: floating toolbar", () => {
  it("shows the format buttons over selected text and bolds it", async () => {
    const { textarea, user } = await renderEditor("make this bold")
    expect(screen.queryByTestId("selection-toolbar")).toBeNull()

    selectText(textarea, "this")
    const toolbar = await screen.findByRole("toolbar", { name: "Format the selected text" })
    const bold = within(toolbar).getByRole("button", { name: "Bold" })
    expect(bold).toHaveAttribute("aria-pressed", "false")
    await user.click(bold)

    await waitFor(() => expect(textarea).toHaveValue("make **this** bold"))
    expect(textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)).toBe("this")
    expect(within(screen.getByTestId("selection-toolbar")).getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })

  it("turns a format off again from the same button", async () => {
    const { textarea, user } = await renderEditor("make **this** bold")
    selectText(textarea, "this")

    await user.click(within(await screen.findByTestId("selection-toolbar")).getByRole("button", { name: "Bold" }))

    await waitFor(() => expect(textarea).toHaveValue("make this bold"))
  })

  it("offers every inline format, link, quote and equation", async () => {
    const { textarea } = await renderEditor("text")
    selectText(textarea, "text")

    const toolbar = await screen.findByRole("toolbar", { name: "Format the selected text" })
    const names = within(toolbar)
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label"))
    expect(names).toEqual([
      "Bold",
      "Italic",
      "Underline",
      "Strikethrough",
      "Code",
      "Spoiler (hidden until clicked)",
      "Link",
      "Quote",
      "Equation",
    ])
  })

  it("hides on Escape and comes back for a new selection", async () => {
    const { textarea, user } = await renderEditor("one two")
    selectText(textarea, "one")
    await screen.findByTestId("selection-toolbar")

    await user.keyboard("{Escape}")
    expect(screen.queryByTestId("selection-toolbar")).toBeNull()

    selectText(textarea, "two")
    expect(await screen.findByTestId("selection-toolbar")).toBeInTheDocument()
  })

  it("moves to the toolbar with Alt+F10, between buttons with arrows and back with Escape", async () => {
    const { textarea, user } = await renderEditor("word")
    selectText(textarea, "word")
    await screen.findByTestId("selection-toolbar")

    await user.keyboard("{Alt>}{F10}{/Alt}")
    const floating = screen.getByRole("toolbar", { name: "Format the selected text" })
    expect(within(floating).getByRole("button", { name: "Bold" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(within(floating).getByRole("button", { name: "Italic" })).toHaveFocus()
    await user.keyboard("{Enter}")
    await waitFor(() => expect(textarea).toHaveValue("*word*"))
    expect(textarea).toHaveFocus()
  })
})

describe("markdown editor: shortcuts", () => {
  it.each([
    ["{Control>}b{/Control}", "**word**"],
    ["{Control>}i{/Control}", "*word*"],
    ["{Control>}u{/Control}", "<u>word</u>"],
    ["{Control>}{Shift>}x{/Shift}{/Control}", "~~word~~"],
    ["{Control>}e{/Control}", "`word`"],
    ["{Control>}{Shift>}p{/Shift}{/Control}", "||word||"],
  ])("%s formats the selection", async (keys, expected) => {
    const { textarea, user } = await renderEditor("word")
    selectText(textarea, "word")

    await user.keyboard(keys)

    await waitFor(() => expect(textarea).toHaveValue(expected))
  })

  it("works with a Cyrillic keyboard layout (the physical key counts)", async () => {
    const { textarea } = await renderEditor("слово")
    selectText(textarea, "слово")

    fireEvent.keyDown(textarea, { key: "и", code: "KeyB", ctrlKey: true })

    await waitFor(() => expect(textarea).toHaveValue("**слово**"))
  })

  it("continues a list on Enter and ends it on an empty item", async () => {
    const { textarea, user } = await renderEditor("- first")
    select(textarea, 7)

    await user.keyboard("{Enter}")
    await waitFor(() => expect(textarea).toHaveValue("- first\n- "))
    await user.keyboard("{Enter}")

    await waitFor(() => expect(textarea).toHaveValue("- first\n"))
  })
})

describe("markdown editor: block toolbar", () => {
  it("makes the caret's line a heading and marks the button pressed", async () => {
    const { textarea, user } = await renderEditor("Title\ntext")
    select(textarea, 2)
    const toolbar = screen.getByRole("toolbar", { name: "Text formatting" })

    await user.selectOptions(within(toolbar).getByRole("combobox", { name: "Paragraph style" }), "heading2")

    await waitFor(() => expect(textarea).toHaveValue("## Title\ntext"))
    expect(within(toolbar).getByRole("combobox", { name: "Paragraph style" })).toHaveValue("heading2")
  })

  it("turns selected lines into a numbered list and back", async () => {
    const { textarea, user } = await renderEditor("a\nb")
    select(textarea, 0, 3)
    const toolbar = screen.getByRole("toolbar", { name: "Text formatting" })

    await user.click(within(toolbar).getByRole("button", { name: "Numbered list" }))
    await waitFor(() => expect(textarea).toHaveValue("1. a\n2. b"))
    select(textarea, 0, textarea.value.length)
    await user.click(within(toolbar).getByRole("button", { name: "Numbered list" }))

    await waitFor(() => expect(textarea).toHaveValue("a\n\nb"))
  })

  it("wraps lines in a code block", async () => {
    const { textarea, user } = await renderEditor("x = 1")
    select(textarea, 0, 5)

    await user.click(screen.getByRole("button", { name: "Code block" }))

    await waitFor(() => expect(textarea).toHaveValue("```\nx = 1\n```"))
  })
})

describe("markdown editor: equation dialog", () => {
  it("previews LaTeX live and inserts it in the text", async () => {
    const { textarea, user } = await renderEditor("Area: ")
    select(textarea, 6)

    await user.keyboard("{Control>}m{/Control}")
    const dialog = await screen.findByRole("dialog", { name: "Insert an equation" })
    await user.type(within(dialog).getByLabelText("LaTeX"), "\\pi r^2")

    await waitFor(() => expect(dialog.querySelector(".katex")).not.toBeNull())
    await user.click(within(dialog).getByRole("button", { name: "Insert" }))

    await waitFor(() => expect(textarea).toHaveValue("Area: $\\pi r^2$"))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("shows the error of invalid LaTeX and does not insert it", async () => {
    const { user } = await renderEditor("")
    await user.click(screen.getByRole("button", { name: "Equation on its own line" }))
    const dialog = await screen.findByRole("dialog", { name: "Insert an equation" })

    await user.type(within(dialog).getByLabelText("LaTeX"), "\\frac{{1")

    expect(await within(dialog).findByTestId("equation-error")).toHaveTextContent("The formula has an error:")
    expect(within(dialog).getByRole("button", { name: "Insert" })).toBeDisabled()
  })

  it("inserts a template and a display formula on its own lines", async () => {
    const { textarea, user } = await renderEditor("Before")
    select(textarea, 6)
    await user.click(screen.getByRole("button", { name: "Equation on its own line" }))
    const dialog = await screen.findByRole("dialog", { name: "Insert an equation" })
    expect(within(dialog).getByRole("radio", { name: "On its own line" })).toHaveAttribute("aria-checked", "true")

    await user.click(within(dialog).getByRole("button", { name: /Insert Fraction/ }))
    expect(within(dialog).getByLabelText("LaTeX")).toHaveValue("\\frac{a}{b}")
    await user.click(within(dialog).getByRole("button", { name: "Insert" }))

    await waitFor(() => expect(textarea).toHaveValue("Before\n$$\n\\frac{a}{b}\n$$"))
  })

  it("edits the formula at the caret", async () => {
    const { textarea, user } = await renderEditor("so $x^2$ here")
    select(textarea, 5)

    await user.keyboard("{Control>}m{/Control}")
    const dialog = await screen.findByRole("dialog", { name: "Edit the equation" })
    const field = within(dialog).getByLabelText("LaTeX")
    expect(field).toHaveValue("x^2")
    await user.clear(field)
    await user.type(field, "y^3")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(textarea).toHaveValue("so $y^3$ here"))
  })
})

describe("markdown editor: links", () => {
  it("links the selected text and refuses unsafe addresses", async () => {
    const { textarea, user } = await renderEditor("see the docs")
    selectText(textarea, "the docs")

    await user.keyboard("{Control>}k{/Control}")
    const dialog = await screen.findByRole("dialog", { name: "Add a link" })
    expect(within(dialog).getByLabelText("Text")).toHaveValue("the docs")
    const url = within(dialog).getByLabelText("Address")
    await user.type(url, "javascript:alert(1)")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(within(dialog).getByText(/Enter a web address/)).toBeInTheDocument()

    await user.clear(url)
    await user.type(url, "ihsu.uz/docs")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(textarea).toHaveValue("see [the docs](https://ihsu.uz/docs)"))
  })

  it("removes a link and keeps its text", async () => {
    const { textarea, user } = await renderEditor("see [docs](https://ihsu.uz)")
    select(textarea, 6)

    await user.keyboard("{Control>}k{/Control}")
    const dialog = await screen.findByRole("dialog", { name: "Edit the link" })
    await user.click(within(dialog).getByRole("button", { name: "Remove the link" }))

    await waitFor(() => expect(textarea).toHaveValue("see docs"))
  })
})

/** Fires a paste with the given clipboard data, as the browser does. */
function paste(textarea: HTMLTextAreaElement, data: Record<string, string>) {
  const event = new Event("paste", { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown }
  event.clipboardData = { getData: (type: string) => data[type] ?? "" }
  act(() => {
    textarea.dispatchEvent(event)
  })
  return event
}

describe("markdown editor: paste", () => {
  it("turns pasted HTML into Markdown", async () => {
    const { textarea } = await renderEditor("Note: ")
    select(textarea, 6)

    const event = paste(textarea, {
      "text/html": "<b>bold</b> and <a href='https://ihsu.uz'>link</a>",
      "text/plain": "x",
    })

    expect(event.defaultPrevented).toBe(true)
    await waitFor(() => expect(textarea).toHaveValue("Note: **bold** and [link](https://ihsu.uz/)"))
  })

  it("leaves plain text and unformatted HTML to the browser", async () => {
    const { textarea } = await renderEditor("")
    select(textarea, 0)

    expect(paste(textarea, { "text/plain": "**literal**" }).defaultPrevented).toBe(false)
    expect(paste(textarea, { "text/html": "<p>plain</p>", "text/plain": "plain" }).defaultPrevented).toBe(false)
  })

  it("pastes plain text after Ctrl+Shift+V", async () => {
    const { textarea } = await renderEditor("")
    select(textarea, 0)

    fireEvent.keyDown(textarea, { key: "V", code: "KeyV", ctrlKey: true, shiftKey: true })

    expect(paste(textarea, { "text/html": "<b>bold</b>", "text/plain": "bold" }).defaultPrevented).toBe(false)
  })
})

describe("markdown editor: preview", () => {
  it("shows the rendered text next to the source and switches views", async () => {
    const { textarea, user } = await renderEditor("Hello ||secret|| $x$")

    const preview = screen.getByRole("region", { name: "Rendered preview" })
    expect(within(preview).getByRole("button", { name: "Hidden text, press to reveal" })).toBeInTheDocument()
    await waitFor(() => expect(preview.querySelector(".katex")).not.toBeNull())

    await user.click(screen.getByRole("button", { name: "Write" }))
    expect(screen.queryByRole("region", { name: "Rendered preview" })).toBeNull()
    await user.click(screen.getByRole("button", { name: "Preview" }))
    expect(screen.getByRole("region", { name: "Rendered preview" })).toBeInTheDocument()
    expect(textarea.closest(".hidden")).not.toBeNull()
  })

  it("says when there is nothing to preview", async () => {
    await renderEditor("")

    expect(screen.getByText("Nothing to preview.")).toBeInTheDocument()
  })
})
