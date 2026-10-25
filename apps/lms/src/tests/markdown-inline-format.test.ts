import { describe, expect, test } from "bun:test"
import { activeInlineFormats, toggleInline } from "../features/step-editor/utils/markdown/inline-format"
import type { InlineFormat } from "../features/step-editor/utils/markdown/markdown-index"
import { marked, show } from "./markdown-test-state"

function toggle(source: string, format: InlineFormat): string {
  return show(toggleInline(marked(source), format))
}

describe("toggleInline: on and off", () => {
  test.each<[string, InlineFormat, string]>([
    ["«hello» world", "bold", "**«hello»** world"],
    ["«hello» world", "italic", "*«hello»* world"],
    ["«hello» world", "underline", "<u>«hello»</u> world"],
    ["«hello» world", "strike", "~~«hello»~~ world"],
    ["«hello» world", "code", "`«hello»` world"],
    ["«hello» world", "spoiler", "||«hello»|| world"],
  ])("%j + %s → %j", (source, format, expected) => {
    expect(toggle(source, format)).toBe(expected)
  })

  test.each<[string, InlineFormat, string]>([
    ["**«hello»** world", "bold", "«hello» world"],
    ["«**hello**» world", "bold", "«hello» world"],
    ["*«hello»* world", "italic", "«hello» world"],
    ["<u>«hello»</u> world", "underline", "«hello» world"],
    ["«<u>hello</u>» world", "underline", "«hello» world"],
    ["~~«hello»~~ world", "strike", "«hello» world"],
    ["`«hello»` world", "code", "«hello» world"],
    ["||«hello»|| world", "spoiler", "«hello» world"],
  ])("toggles %j off with %s", (source, format, expected) => {
    expect(toggle(source, format)).toBe(expected)
  })

  test("turning a format on and off again gives back the text", () => {
    const once = toggleInline(marked("a «big» word"), "bold")
    const twice = toggleInline(once, "bold")

    expect(show(twice)).toBe("a «big» word")
  })
})

describe("toggleInline: parts of spans", () => {
  test("turning off the middle of a span splits it", () => {
    expect(toggle("**ab«cd»ef**", "bold")).toBe("**ab**«cd»**ef**")
  })

  test("turning off the start of a span keeps the rest", () => {
    expect(toggle("**«ab»cdef**", "bold")).toBe("«ab»**cdef**")
  })

  test("a selection over part of a span extends it instead of doubling markers", () => {
    expect(toggle("a «**bc** d»", "bold")).toBe("a **«bc d»**")
    expect(toggle("«a **bc**» d", "bold")).toBe("**«a bc»** d")
  })

  test("a selection touching a span joins it", () => {
    expect(toggle("**a**«b»", "bold")).toBe("**a«b»**")
  })

  test("a span separated by a space stays separate", () => {
    expect(toggle("**a** «b»", "bold")).toBe("**a** **«b»**")
  })

  test("a format crossing another one is split at its edge so the markers nest", () => {
    expect(toggle("**a «b** c» d", "italic")).toBe("**a *«b*** *c»* d")
  })

  test("italic inside a bold word stays readable (CommonMark delimiter rules)", () => {
    expect(toggle("a**«b»c**", "italic")).toBe("a***«b»*c**")
    expect(toggle("«a**b»c**", "italic")).toBe("*«a****b»*c**")
  })

  test("removes one of two formats sharing markers", () => {
    expect(toggle("***«x»***", "italic")).toBe("**«x»**")
    expect(toggle("***«x»***", "bold")).toBe("*«x»*")
  })
})

describe("toggleInline: lines and blocks", () => {
  test("lines of one paragraph are wrapped together", () => {
    expect(toggle("«line one\nline two»", "bold")).toBe("**«line one\nline two»**")
  })

  test("each list item is wrapped on its own, after its marker", () => {
    expect(toggle("«- a\n- b»", "bold")).toBe("«- **a**\n- **b»**")
  })

  test("paragraphs are wrapped one by one", () => {
    expect(toggle("«para\n\npara2»", "italic")).toBe("*«para*\n\n*para2»*")
  })

  test("quote markers of continuation lines stay outside", () => {
    expect(toggle("> «a\n> b»", "bold")).toBe("> **«a\n> b»**")
  })

  test("a heading keeps its marker", () => {
    expect(toggle("# «Title»", "underline")).toBe("# <u>«Title»</u>")
  })

  test("code blocks are left alone", () => {
    expect(toggle("```\n«code»\n```", "bold")).toBe("```\n«code»\n```")
  })

  test("spaces at the edges of the selection stay outside the markers", () => {
    expect(toggle("«  spaced  »", "bold")).toBe("«  **spaced**  »")
  })

  test("formats work in table cells", () => {
    expect(toggle("| a |\n|---|\n| «b» |", "bold")).toBe("| a |\n|---|\n| **«b»** |")
  })

  test("spoilers are not added in table cells, where pipes split cells", () => {
    expect(toggle("| a |\n|---|\n| «b» |", "spoiler")).toBe("| a |\n|---|\n| «b» |")
  })
})

describe("toggleInline: code, formulas and escapes", () => {
  test("inline code and formulas inside the selection are wrapped whole", () => {
    expect(toggle("«x `code` y»", "bold")).toBe("**«x `code` y»**")
    expect(toggle("«a $x^2$ b»", "strike")).toBe("~~«a $x^2$ b»~~")
  })

  test("a selection cutting inline code in half takes the whole code", () => {
    expect(toggle("x `co«de` y»", "bold")).toBe("x **`co«de` y»**")
  })

  test("code with backticks inside gets a longer fence", () => {
    expect(toggle("«a`b»", "code")).toBe("``«a`b»``")
  })

  test("turning off part of inline code splits it", () => {
    expect(toggle("`a«b»c`", "code")).toBe("`a`«b»`c`")
  })

  test("escaped characters stay escaped", () => {
    expect(toggle("«a\\*b»", "bold")).toBe("**«a\\*b»**")
  })

  test("a selection starting at punctuation inside a word widens to the word", () => {
    expect(toggle("a«(b)»", "bold")).toBe("**«a(b)»**")
  })
})

describe("toggleInline: caret", () => {
  test("formats the word under the caret", () => {
    expect(toggle("he‸llo world", "bold")).toBe("**he‸llo** world")
  })

  test("removes the span around the caret", () => {
    expect(toggle("**he‸llo** world", "bold")).toBe("he‸llo world")
  })

  test("inserts an empty pair to type into, and removes it again", () => {
    expect(toggle("a ‸ b", "bold")).toBe("a **‸** b")
    expect(toggle("a **‸** b", "bold")).toBe("a ‸ b")
  })

  test("does nothing in a code block", () => {
    expect(toggle("```\nco‸de\n```", "bold")).toBe("```\nco‸de\n```")
  })
})

describe("activeInlineFormats", () => {
  test("lists the formats of every selected character", () => {
    expect([...activeInlineFormats(marked("**«a *b* c»**"))]).toEqual(["bold"])
    expect([...activeInlineFormats(marked("**a *«b»* c**"))]).toEqual(["bold", "italic"])
  })

  test("reads the formats around the caret", () => {
    expect([...activeInlineFormats(marked("||<u>a‸b</u>||"))]).toEqual(["underline", "spoiler"])
  })

  test("is empty for plain text", () => {
    expect(activeInlineFormats(marked("«plain»")).size).toBe(0)
  })
})
