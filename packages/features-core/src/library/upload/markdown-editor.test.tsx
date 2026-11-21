import { describe, expect, it } from "bun:test"
import { screen, waitFor } from "@testing-library/react"
import { renderLibrary } from "../test-support"
import { MarkdownEditor } from "./markdown-editor"

describe("MarkdownEditor", () => {
  it("shows stored Markdown as formatted text under the given accessible name", async () => {
    renderLibrary(
      <MarkdownEditor value="one **two** three" onChange={() => {}} label="Note text" defaultMode="visual" />,
    )

    // The editor mounts after the first render and may replace its element, so the field is looked up again on each try.
    await waitFor(
      () => expect(screen.getByRole("textbox", { name: "Note text" }).querySelector("strong")?.textContent).toBe("two"),
      {
        timeout: 15_000,
      },
    )
  })
})
