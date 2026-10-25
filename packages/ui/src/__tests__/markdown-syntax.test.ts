import { describe, expect, test } from "bun:test"
import type { Nodes } from "mdast"
import { parseMarkdown } from "../lib/markdown/parse-markdown"

/** A compact outline of the tree: `type(children)` for parents, `type:"value"` for literals. */
function outline(node: Nodes): string {
  if ("children" in node) return `${node.type}(${node.children.map(outline).join(", ")})`
  if ("value" in node) return `${node.type}:${JSON.stringify(node.value)}`
  return node.type
}

/** The outline of the first paragraph (or other block) of `source`. */
function first(source: string): string {
  const block = parseMarkdown(source).children[0]
  if (!block) throw new Error("no blocks")
  return outline(block)
}

function mathClass(source: string): unknown {
  const paragraph = parseMarkdown(source).children[0]
  const math =
    paragraph && "children" in paragraph ? paragraph.children.find((node) => node.type === "inlineMath") : null
  return math?.data?.hProperties?.className
}

describe("inline math", () => {
  test.each([
    ["$x$", 'paragraph(inlineMath:"x")'],
    ["$x$ and $y$", 'paragraph(inlineMath:"x", text:" and ", inlineMath:"y")'],
    ["$a$,$b$", 'paragraph(inlineMath:"a", text:",", inlineMath:"b")'],
    ["area $\\pi r^2$.", 'paragraph(text:"area ", inlineMath:"\\\\pi r^2", text:".")'],
    ["$a + b$", 'paragraph(inlineMath:"a + b")'],
    ["$a\nb$", 'paragraph(inlineMath:"a\\nb")'],
  ])("%j is inline math", (source, expected) => {
    expect(first(source)).toBe(expected)
  })

  test.each([
    ["costs $5 and $10", "two prices"],
    ["$5-$10", "a price range"],
    ["price 10$-20$", "dollars after the numbers"],
    ["a $ b $ c", "spaces inside the dollars"],
    ["$x $", "a space before the closing dollar"],
    ["$ x$", "a space after the opening dollar"],
    ["$x$5", "a digit right after the closing dollar"],
    ["2$x$", "a digit right before the opening dollar"],
    ["only $", "a lone dollar"],
    ["a $$$ b", "only dollars"],
    ["a $$x", "an unclosed double dollar"],
    ["$a$$b$", "a single dollar closed by a double one"],
  ])("%j stays text (%s)", (source) => {
    expect(first(source)).toBe(`paragraph(text:${JSON.stringify(source)})`)
  })

  test("the first dollar after a price decides, so a later formula still works", () => {
    expect(first("costs $5 and $x$ here")).toBe('paragraph(text:"costs $5 and ", inlineMath:"x", text:" here")')
  })

  test("an escaped dollar outside math is a literal dollar", () => {
    expect(first("\\$x$")).toBe('paragraph(text:"$x$")')
    expect(first("\\$5 and \\$10")).toBe('paragraph(text:"$5 and $10")')
  })

  test("an escaped dollar right before a formula does not stop it", () => {
    expect(first("\\$$x$")).toBe('paragraph(text:"$", inlineMath:"x")')
  })

  test("an escaped dollar inside math is part of the formula and does not close it", () => {
    expect(first("$\\$5$")).toBe('paragraph(inlineMath:"\\\\$5")')
    expect(first("$a\\$b$")).toBe('paragraph(inlineMath:"a\\\\$b")')
  })

  test("a dollar after an escaped backslash closes the formula", () => {
    expect(first("$a\\\\$ b")).toBe('paragraph(inlineMath:"a\\\\\\\\", text:" b")')
  })

  test("dollars inside inline code stay code", () => {
    expect(first("`$x$`")).toBe('paragraph(inlineCode:"$x$")')
  })

  test("single dollar math renders inline", () => {
    expect(mathClass("so $x$ here")).toEqual(["language-math", "math-inline"])
  })
})

describe("display math", () => {
  test("double dollars in a sentence are display math", () => {
    expect(first("text $$x^2$$ more")).toBe('paragraph(text:"text ", inlineMath:"x^2", text:" more")')
    expect(mathClass("text $$x^2$$ more")).toEqual(["language-math", "math-display"])
  })

  test("double dollars may hold single dollars and spaces, trimmed like code spans", () => {
    expect(first("$$ a $ b $$")).toBe('paragraph(inlineMath:"a $ b")')
    expect(first("$$ x $$")).toBe('paragraph(inlineMath:"x")')
  })

  test("a block between $$ lines is display math", () => {
    expect(first("$$\n\\frac{a}{b}\n$$")).toBe('math:"\\\\frac{a}{b}"')
  })

  test("a $$ line without a closing one opens a display block to the end, like a code fence", () => {
    expect(first("$$\nx")).toBe('math:"x"')
  })

  test("a display block keeps several lines and dollars", () => {
    expect(first("$$\na = 1 \\\\\nb = \\$2\n$$")).toBe('math:"a = 1 \\\\\\\\\\nb = \\\\$2"')
  })
})

describe("math in tables", () => {
  test("an escaped pipe in a table cell formula is a pipe", () => {
    const table = parseMarkdown("| a |\n|---|\n| $\\|x\\|$ |").children[0]
    expect(table && outline(table)).toBe('table(tableRow(tableCell(text:"a")), tableRow(tableCell(inlineMath:"|x|")))')
  })

  test("outside tables the pipe escape stays a LaTeX command", () => {
    expect(first("$\\|v\\|$")).toBe('paragraph(inlineMath:"\\\\|v\\\\|")')
  })
})

describe("spoilers", () => {
  test.each([
    ["||secret||", 'paragraph(spoiler(text:"secret"))'],
    ["x||y||z", 'paragraph(text:"x", spoiler(text:"y"), text:"z")'],
    ["||**b**||", 'paragraph(spoiler(strong(text:"b")))'],
    ["a||**b**||c", 'paragraph(text:"a", spoiler(strong(text:"b")), text:"c")'],
    ["**||x||**", 'paragraph(strong(spoiler(text:"x")))'],
    ["||a\nb||", 'paragraph(spoiler(text:"a\\nb"))'],
    ["||$x$||", 'paragraph(spoiler(inlineMath:"x"))'],
    ["||a|| and ||b||", 'paragraph(spoiler(text:"a"), text:" and ", spoiler(text:"b"))'],
  ])("%j", (source, expected) => {
    expect(first(source)).toBe(expected)
  })

  test.each([
    ["a || b", "pipes between spaces"],
    ["|||x|||", "three pipes"],
    ["|| x||", "a space after the opening pipes"],
    ["||x ||", "a space before the closing pipes"],
    ["||open", "no closing pipes"],
  ])("%j stays text (%s)", (source) => {
    expect(first(source)).toBe(`paragraph(text:${JSON.stringify(source)})`)
  })

  test("escaped pipes are literal pipes", () => {
    expect(first("\\|\\|x\\|\\|")).toBe('paragraph(text:"||x||")')
  })

  test("a spoiler renders as a span marked data-spoiler", () => {
    const paragraph = parseMarkdown("||x||").children[0]
    const spoiler = paragraph && "children" in paragraph ? paragraph.children[0] : undefined
    expect(spoiler?.data).toEqual({ hName: "span", hProperties: { dataSpoiler: "" } })
  })
})

describe("underline", () => {
  test.each([
    ["<u>under</u>", 'paragraph(underline(text:"under"))'],
    ["<U>up</U>", 'paragraph(underline(text:"up"))'],
    ["**<u>b</u>**", 'paragraph(strong(underline(text:"b")))'],
    ["<u>**b**</u>", 'paragraph(underline(strong(text:"b")))'],
    ["<u>a <u>b</u> c</u>", 'paragraph(underline(text:"a ", underline(text:"b"), text:" c"))'],
    ["- <u>item</u>", 'list(listItem(paragraph(underline(text:"item"))))'],
    ["# <u>title</u>", 'heading(underline(text:"title"))'],
  ])("%j", (source, expected) => {
    expect(first(source)).toBe(expected)
  })

  test.each([
    ["<u>x", 'paragraph(html:"<u>", text:"x")'],
    ["x</u>", 'paragraph(text:"x", html:"</u>")'],
    ["<u>a **b</u> c**", 'paragraph(html:"<u>", text:"a ", strong(text:"b", html:"</u>", text:" c"))'],
    ['<u class="x">y</u>', 'paragraph(html:"<u class=\\"x\\">", text:"y", html:"</u>")'],
    ["`<u>x</u>`", 'paragraph(inlineCode:"<u>x</u>")'],
  ])("%j stays raw (shown as text)", (source, expected) => {
    expect(first(source)).toBe(expected)
  })

  test("an underline spans from its opening tag to its closing tag in the source", () => {
    const paragraph = parseMarkdown("a <u>b</u> c").children[0]
    const underline = paragraph && "children" in paragraph ? paragraph.children[1] : undefined
    expect(underline?.position?.start.offset).toBe(2)
    expect(underline?.position?.end.offset).toBe(10)
    expect(underline?.data).toEqual({ hName: "u" })
  })
})

describe("GFM stays", () => {
  test("strikethrough, task lists and autolinks still parse", () => {
    expect(first("~~gone~~")).toBe('paragraph(delete(text:"gone"))')
    expect(first("- [x] done")).toBe('list(listItem(paragraph(text:"done")))')
    expect(first("see https://ihsu.uz")).toBe('paragraph(text:"see ", link(text:"https://ihsu.uz"))')
  })
})
