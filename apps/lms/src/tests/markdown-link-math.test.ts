import { describe, expect, test } from "bun:test"
import { applyLink, linkDraftAt, normalizeUrl, removeLink } from "../features/step-editor/utils/markdown/link-format"
import { formulaAt, insertFormula } from "../features/step-editor/utils/markdown/math-format"
import { marked, show } from "./markdown-test-state"

function formula(source: string, latex: string, display = false): string | null {
  const result = insertFormula(marked(source), { latex, display })
  return result && show(result)
}

describe("insertFormula: inline", () => {
  test("writes $…$ at the caret, with the caret after it", () => {
    expect(formula("Area: ‸.", "\\pi r^2")).toBe("Area: $\\pi r^2$‸.")
  })

  test("replaces the selected text", () => {
    expect(formula("so «x^2» here", "x^2")).toBe("so $x^2$‸ here")
  })

  test("adds a space where a digit or dollar next to it would stop the formula", () => {
    expect(formula("2‸", "x")).toBe("2 $x$‸")
    expect(formula("‸5", "x")).toBe("$x$‸ 5")
    expect(formula("$a$‸", "b")).toBe("$a$ $b$‸")
  })

  test("adds a space after an escaping backslash", () => {
    expect(formula("a\\‸", "x")).toBe("a\\ $x$‸")
  })

  test("puts a multi-line formula on one line", () => {
    expect(formula("‸", "a +\n b")).toBe("$a + b$‸")
  })

  test("edits the formula at the caret", () => {
    expect(formula("so $x‸^2$ here", "y^3")).toBe("so $y^3$‸ here")
  })

  test("refuses a formula that would not read back", () => {
    expect(formula("‸", "a $ b")).toBeNull()
    expect(formula("‸", "   ")).toBeNull()
  })
})

describe("insertFormula: display", () => {
  test("writes a $$ block on its own lines", () => {
    expect(formula("‸", "\\int_0^1 x\\,dx", true)).toBe("$$\n\\int_0^1 x\\,dx\n$$‸")
  })

  test("splits the line around the caret", () => {
    expect(formula("before ‸after", "x", true)).toBe("before\n$$\nx\n$$‸\nafter")
  })

  test("keeps quote markers and list indentation", () => {
    expect(formula("> ‸", "x", true)).toBe("> $$\n> x\n> $$‸")
    expect(formula("- item ‸", "x", true)).toBe("- item\n  $$\n  x\n  $$‸")
  })

  test("edits a display block in place", () => {
    expect(formula("a\n\n$$\nx‸\n$$\n\nb", "y\nz", true)).toBe("a\n\n$$\ny\nz\n$$‸\n\nb")
  })

  test("turns a display block into inline math", () => {
    expect(formula("$$\nx‸\n$$", "x")).toBe("$x$‸")
  })

  test("keeps $$…$$ inside a sentence where it was", () => {
    expect(formula("so $$x‸$$ here", "y", true)).toBe("so $$y$$‸ here")
  })
})

describe("formulaAt", () => {
  test("reads the formula at the caret for editing", () => {
    expect(formulaAt(marked("a $x‸$ b"), true)).toEqual({ latex: "x", display: false, editing: true })
    expect(formulaAt(marked("$$\nx‸\n$$"), false)).toEqual({ latex: "x", display: true, editing: true })
  })

  test("starts a new formula from the selection", () => {
    expect(formulaAt(marked("a « x^2 » b"), false)).toEqual({ latex: "x^2", display: false, editing: false })
  })
})

describe("normalizeUrl", () => {
  test.each([
    ["https://ihsu.uz/a?b=c#d", "https://ihsu.uz/a?b=c#d"],
    ["  http://example.com ", "http://example.com"],
    ["mailto:dean@ihsu.uz", "mailto:dean@ihsu.uz"],
    ["ihsu.uz/courses", "https://ihsu.uz/courses"],
    ["/course/step/?id=1", "/course/step/?id=1"],
    ["#section", "#section"],
  ])("%j → %j", (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected)
  })

  test.each([["javascript:alert(1)"], ["data:text/html,x"], ["//evil.example"], ["just words"], [""], ["https://"]])(
    "refuses %j",
    (input) => {
      expect(normalizeUrl(input)).toBeNull()
    },
  )
})

describe("links", () => {
  test("wraps the selection in a link", () => {
    expect(show(applyLink(marked("see «the docs» now"), "the docs", "https://ihsu.uz/docs"))).toBe(
      "see [the docs](https://ihsu.uz/docs)‸ now",
    )
  })

  test("uses the address as text when there is no text", () => {
    expect(show(applyLink(marked("‸"), "", "mailto:dean@ihsu.uz"))).toBe("[dean@ihsu.uz](mailto:dean@ihsu.uz)‸")
  })

  test("escapes brackets in the text and encodes spaces and parentheses in the address", () => {
    expect(show(applyLink(marked("‸"), "a [b]", "https://x.uz/a b(c)"))).toBe("[a \\[b\\]](https://x.uz/a%20b%28c%29)‸")
  })

  test("edits the link at the caret", () => {
    const state = marked("see [do‸cs](https://old.uz) now")
    expect(linkDraftAt(state)).toEqual({ text: "docs", url: "https://old.uz", editing: true })
    expect(show(applyLink(state, "docs", "https://new.uz"))).toBe("see [docs](https://new.uz)‸ now")
  })

  test("removes the link and keeps its text selected", () => {
    expect(show(removeLink(marked("see [**do‸cs**](https://x.uz) now")))).toBe("see «**docs**» now")
  })

  test("starts a new link from the selected text on one line", () => {
    expect(linkDraftAt(marked("«two\nlines»"))).toEqual({ text: "two lines", url: "", editing: false })
  })
})
