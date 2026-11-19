import { describe, expect, it } from "bun:test"
import { screen, waitFor } from "@testing-library/react"
import { renderLibrary } from "../test-support"
import { MarkdownEditor } from "./markdown-editor"

describe("MarkdownEditor", () => {
  it("shows stored Markdown as formatted text under the given accessible name", async () => {
    renderLibrary(
      <MarkdownEditor value="one **two** three" onChange={() => {}} label="Note text" defaultMode="visual" />,
    )

    const field = await screen.findByRole("textbox", { name: "Note text" })
    await waitFor(() => expect(field.querySelector("strong")?.textContent).toBe("two"))
  })
})
