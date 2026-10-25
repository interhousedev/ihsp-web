import { describe, expect, test } from "bun:test"
import { combineNotesMarkdown } from "./combine-notes"

describe("combineNotesMarkdown", () => {
  test("gives every note a second-level heading and separates the sections by a blank line", () => {
    expect(
      combineNotesMarkdown([
        { title: "One", body: "First body." },
        { title: "Two", body: "Second body\n\n- a\n- b" },
      ]),
    ).toBe("## One\n\nFirst body.\n\n## Two\n\nSecond body\n\n- a\n- b")
  })

  test("strips citation markers, source and web ones", () => {
    expect(combineNotesMarkdown([{ title: "One", body: "Plants make sugar ⟦1⟧. More ⟦2,3⟧." }])).toBe(
      "## One\n\nPlants make sugar. More.",
    )
  })

  test("keeps the heading of an empty note and trims the bodies", () => {
    expect(
      combineNotesMarkdown([
        { title: "Empty", body: null },
        { title: "Padded", body: "\n  text  \n" },
      ]),
    ).toBe("## Empty\n\n## Padded\n\ntext")
  })
})
