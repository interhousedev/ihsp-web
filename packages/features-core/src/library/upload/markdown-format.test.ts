import { describe, expect, it } from "bun:test"
import { applyFormat } from "./markdown-format"

const placeholders = { text: "text", formula: "x^2", url: "https://" }
const apply = (text: string, start: number, end: number, action: Parameters<typeof applyFormat>[3]) =>
  applyFormat(text, start, end, action, placeholders)

describe("applyFormat", () => {
  it("wraps the selection in bold and keeps it selected", () => {
    const edit = apply("one two three", 4, 7, "bold")

    expect(edit.text).toBe("one **two** three")
    expect(edit.text.slice(edit.start, edit.end)).toBe("two")
  })

  it("inserts a placeholder that is selected when nothing was selected", () => {
    const edit = apply("", 0, 0, "italic")

    expect(edit.text).toBe("_text_")
    expect(edit.text.slice(edit.start, edit.end)).toBe("text")
  })

  it("makes a formula in a line and in a block", () => {
    const inline = apply("a b", 2, 3, "math")
    const block = apply("a", 1, 1, "mathBlock")

    expect(inline.text).toBe("a $b$")
    expect(block.text).toBe("a\n$$\nx^2\n$$\n")
    expect(block.text.slice(block.start, block.end)).toBe("x^2")
  })

  it("puts the cursor on the address of a link", () => {
    const edit = apply("see docs", 4, 8, "link")

    expect(edit.text).toBe("see [docs](https://)")
    expect(edit.text.slice(edit.start, edit.end)).toBe("https://")
  })

  it("prefixes every line of the selection for headings, lists and quotes", () => {
    expect(apply("a\nb\nc", 0, 5, "bullet").text).toBe("- a\n- b\n- c")
    expect(apply("a\nb\nc", 2, 3, "heading").text).toBe("a\n## b\nc")
    expect(apply("a\nb", 0, 3, "numbered").text).toBe("1. a\n2. b")
    expect(apply("a\nb", 0, 1, "quote").text).toBe("> a\nb")
  })
})
