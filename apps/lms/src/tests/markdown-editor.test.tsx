import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { MarkdownEditor } from "../features/step-editor/components/markdown-editor"

describe("MarkdownEditor", () => {
  it("shows stored Markdown as formatted text under the given accessible name", async () => {
    renderWithProviders(<MarkdownEditor value="a *b* c" onChange={() => {}} label="Block 1" />)

    await waitFor(
      () => expect(screen.getByRole("textbox", { name: "Block 1" }).querySelector("em")?.textContent).toBe("b"),
      {
        timeout: 15_000,
      },
    )
  })
})

describe("MarkdownEditor with formulas", () => {
  it("opens a lesson text with a formula as Markdown text instead of rewriting it", async () => {
    const text = "Area is $\\pi r^2$"
    renderWithProviders(<MarkdownEditor value={text} onChange={() => {}} label="Block 2" />)

    const field = (await screen.findByRole("textbox", { name: "Block 2" })) as HTMLTextAreaElement
    await waitFor(() => expect(field.tagName).toBe("TEXTAREA"))
    expect(field.value).toBe(text)
  })
})
