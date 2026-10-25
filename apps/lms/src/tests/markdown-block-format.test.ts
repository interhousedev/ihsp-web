import { describe, expect, test } from "bun:test"
import { activeBlockFormats, type BlockFormat, toggleBlock } from "../features/step-editor/utils/markdown/block-format"
import { toggleCodeBlock } from "../features/step-editor/utils/markdown/code-block"
import { continueList } from "../features/step-editor/utils/markdown/continue-list"
import { marked, show } from "./markdown-test-state"

function toggle(source: string, format: BlockFormat): string {
  return show(toggleBlock(marked(source), format))
}

describe("toggleBlock: headings", () => {
  test.each<[string, BlockFormat, string]>([
    ["a‸bc", "heading1", "# a‸bc"],
    ["# a‸bc", "heading1", "a‸bc"],
    ["# a‸bc", "heading2", "## a‸bc"],
    ["«a\nb»", "heading3", "### «a\n### b»"],
    ["- a‸", "heading2", "- ## a‸"],
  ])("%j + %s → %j", (source, format, expected) => {
    expect(toggle(source, format)).toBe(expected)
  })

  test("a heading in the middle of a paragraph splits it", () => {
    expect(toggle("x\n«y»\nz", "heading2")).toBe("x\n## «y»\nz")
  })

  test("removing a heading keeps the line a paragraph of its own", () => {
    expect(toggle("x\n## «y»\nz", "heading2")).toBe("x\n\n«y»\n\nz")
    expect(toggle("x\n«# a\n# b»\ny", "heading1")).toBe("x\n\n«a\n\nb»\n\ny")
  })

  test("leaves code blocks alone", () => {
    expect(toggle("«```\ncode\n```»", "heading1")).toBe("«```\ncode\n```»")
  })
})

describe("toggleBlock: lists", () => {
  test("turns lines into list items", () => {
    expect(toggle("«a\nb»", "bulletList")).toBe("- «a\n- b»")
    expect(toggle("«a\n\nb»", "orderedList")).toBe("1. «a\n\n2. b»")
  })

  test("switches the kind of list", () => {
    expect(toggle("«- a\n- b»", "orderedList")).toBe("1. «a\n2. b»")
  })

  test("removing a list keeps the items apart", () => {
    expect(toggle("«- a\n- b»", "bulletList")).toBe("«a\n\nb»")
  })

  test("continues the numbers of an ordered list right above", () => {
    expect(toggle("1. a\n«b»", "orderedList")).toBe("1. a\n2. «b»")
  })

  test("a new item does not swallow the next line", () => {
    expect(toggle("a\n«b»\nc", "bulletList")).toBe("a\n- «b»\n\nc")
  })

  test("a removed item stays apart from the item above", () => {
    expect(toggle("- a\n- «b»", "bulletList")).toBe("- a\n\n«b»")
  })

  test("a line that continued an item stays with it when the list is removed", () => {
    expect(toggle("- «a»\nb", "bulletList")).toBe("«a»\nb")
  })

  test("text indented under an item stays with its item", () => {
    expect(toggle("«- a\n  more\n- b»", "bulletList")).toBe("«a\n  more\n\nb»")
  })

  test("works inside quotes", () => {
    expect(toggle("> «a»", "bulletList")).toBe("> - «a»")
    expect(toggle("> - «a»", "bulletList")).toBe("> «a»")
  })

  test("a selection ending at the start of a line leaves that line alone", () => {
    expect(toggle("«a\n»b", "bulletList")).toBe("- «a\n\n»b")
  })
})

describe("toggleBlock: quotes", () => {
  test("quotes and unquotes lines", () => {
    expect(toggle("«a\nb»", "quote")).toBe("> «a\n> b»")
    expect(toggle("«> a\n> b»", "quote")).toBe("«a\nb»")
  })

  test("blank lines inside the selection stay inside the quote", () => {
    expect(toggle("«a\n\nb»", "quote")).toBe("> «a\n>\n> b»")
  })

  test("a quoted line does not pull in the next line", () => {
    expect(toggle("«x»\ny", "quote")).toBe("> «x»\n\ny")
    expect(toggle("x\n«y»", "quote")).toBe("x\n> «y»")
  })

  test("an unquoted line leaves the rest of the quote", () => {
    expect(toggle("> a\n> «b»", "quote")).toBe("> a\n\n«b»")
  })

  test("a whole code block goes into the quote", () => {
    expect(toggle("«a\n```\nco»de\n```", "quote")).toBe("> «a\n> ```\n> co»de\n> ```")
  })
})

describe("activeBlockFormats", () => {
  test("reads the formats every selected line has", () => {
    expect([...activeBlockFormats(marked("> - «a\n> - b»"))]).toEqual(["bulletList", "quote"])
    expect([...activeBlockFormats(marked("## «a»"))]).toEqual(["heading2"])
    expect(activeBlockFormats(marked("«a\n- b»")).size).toBe(0)
  })
})

describe("toggleCodeBlock", () => {
  test("puts the selected lines in a code block", () => {
    expect(show(toggleCodeBlock(marked("«a\nb»")))).toBe("```\n«a\nb»\n```")
  })

  test("inserts an empty block on an empty line, with the caret inside", () => {
    expect(show(toggleCodeBlock(marked("text\n‸")))).toBe("text\n```\n‸\n```")
  })

  test("does not nest code blocks", () => {
    expect(show(toggleCodeBlock(marked("«a\n```\nb\n```»")))).toBe("«a\n```\nb\n```»")
  })

  test("takes a code block apart again", () => {
    expect(show(toggleCodeBlock(marked("«```\nx\n```»")))).toBe("«x»")
    expect(show(toggleCodeBlock(marked("```js\nco‸de\n```")))).toBe("co‸de")
  })

  test("keeps the quote markers inside a quote", () => {
    expect(show(toggleCodeBlock(marked("> «a»")))).toBe("> ```\n> «a»\n> ```")
    expect(show(toggleCodeBlock(marked("> ```\n> «a»\n> ```")))).toBe("> «a»")
  })
})

describe("continueList", () => {
  test.each([
    ["- a‸", "- a\n- ‸"],
    ["* a‸", "* a\n* ‸"],
    ["1. a‸", "1. a\n2. ‸"],
    ["9) a‸", "9) a\n10) ‸"],
    ["  - nested‸", "  - nested\n  - ‸"],
    ["- [x] done‸", "- [x] done\n- [ ] ‸"],
    ["> quoted‸", "> quoted\n> ‸"],
    ["> - a‸", "> - a\n> - ‸"],
    ["- sp‸lit", "- sp\n- ‸lit"],
  ])("%j → %j", (source, expected) => {
    const result = continueList(marked(source))
    expect(result && show(result)).toBe(expected)
  })

  test.each([
    ["- a\n- ‸", "- a\n‸"],
    ["> a\n> ‸", "> a\n‸"],
    ["> - ‸", "> ‸"],
    ["- [ ] ‸", "‸"],
  ])("an empty item ends the list: %j → %j", (source, expected) => {
    const result = continueList(marked(source))
    expect(result && show(result)).toBe(expected)
  })

  test.each([["plain‸"], ["```\n- a‸\n```"], ["«- a»"], ["‸- a"]])("leaves Enter alone in %j", (source) => {
    expect(continueList(marked(source))).toBeNull()
  })
})
