import { describe, expect, test } from "bun:test"
import { htmlToMarkdown } from "../features/step-editor/utils/markdown/html-to-markdown"

describe("htmlToMarkdown: inline formats", () => {
  test.each([
    ["<b>bold</b> text", "**bold** text"],
    ["<strong>bold</strong>", "**bold**"],
    ["<i>it</i> and <em>em</em>", "*it* and *em*"],
    ["<u>under</u>", "<u>under</u>"],
    ["<s>a</s> <del>b</del> <strike>c</strike>", "~~a~~ ~~b~~ ~~c~~"],
    ["use <code>npm i</code> now", "use `npm i` now"],
    ["<code>a`b</code>", "``a`b``"],
    ['<span class="tg-spoiler">secret</span>', "||secret||"],
    ["<tg-spoiler>secret</tg-spoiler>", "||secret||"],
  ])("%j → %j", (html, expected) => {
    expect(htmlToMarkdown(html)).toBe(expected)
  })

  test("nests formats without doubling markers", () => {
    expect(htmlToMarkdown("<b>a <i>b</i> <b>c</b></b>")).toBe("**a *b* c**")
  })

  test("keeps spaces outside the markers", () => {
    expect(htmlToMarkdown("x<b> bold </b>y")).toBe("x **bold** y")
  })

  test("reads styled spans like word processors write them", () => {
    const docs =
      '<b style="font-weight:normal;" id="docs-internal-guid-1"><span style="font-weight:700">Bold</span>' +
      '<span style="font-weight:400"> plain </span><span style="font-style:italic">it</span>' +
      '<span style="text-decoration:underline">u</span><span style="text-decoration-line:line-through">s</span></b>'
    expect(htmlToMarkdown(docs)).toBe("**Bold** plain *it*<u>u</u>~~s~~")
  })
})

describe("htmlToMarkdown: links", () => {
  test("keeps web and mail links", () => {
    expect(htmlToMarkdown('<a href="https://ihsu.uz/a b">site</a> <a href="mailto:x@ihsu.uz">mail</a>')).toBe(
      "[site](https://ihsu.uz/a%20b) [mail](mailto:x@ihsu.uz)",
    )
  })

  test("drops script and relative links but keeps their text", () => {
    expect(htmlToMarkdown('<a href="javascript:alert(1)">x</a> <a href="/wiki/Y">y</a> <b>z</b>')).toBe("x y **z**")
  })

  test("puts formats inside links", () => {
    expect(htmlToMarkdown('<a href="https://x.uz/"><b>bold link</b></a>')).toBe("[**bold link**](https://x.uz/)")
  })
})

describe("htmlToMarkdown: blocks", () => {
  test("turns paragraphs, headings and line breaks into Markdown blocks", () => {
    expect(htmlToMarkdown("<h1>Title</h1><p>One<br>two</p><p><b>Three</b></p>")).toBe(
      "# Title\n\nOne\ntwo\n\n**Three**",
    )
  })

  test("caps headings at level 3", () => {
    expect(htmlToMarkdown("<h5>Small</h5>")).toBe("### Small")
  })

  test("writes nested lists", () => {
    expect(htmlToMarkdown('<ul><li>a</li><li>b<ol start="3"><li>c</li></ol></li></ul>')).toBe("- a\n- b\n\n  3. c")
  })

  test("writes quotes and code blocks with their language", () => {
    expect(htmlToMarkdown('<blockquote><p>q</p></blockquote><pre><code class="language-py">x = 1\n</code></pre>')).toBe(
      "> q\n\n```py\nx = 1\n```",
    )
  })

  test("reads formulas back from rendered math", () => {
    const html =
      '<p>Area <span class="katex"><span class="katex-mathml"><math><semantics><mrow></mrow>' +
      '<annotation encoding="application/x-tex">\\pi r^2</annotation></semantics></math></span>' +
      '<span class="katex-html" aria-hidden="true">πr2</span></span></p>'
    expect(htmlToMarkdown(html)).toBe("Area $\\pi r^2$")
  })
})

describe("htmlToMarkdown: safety and plain text", () => {
  test("drops scripts, styles, images and forms", () => {
    expect(
      htmlToMarkdown('<style>b{}</style><script>alert(1)</script><img src="x" onerror="y"><b>ok</b><input value="v">'),
    ).toBe("**ok**")
  })

  test("escapes Markdown characters in the text", () => {
    expect(htmlToMarkdown("<b>x</b> 2*3 [a] &lt;tag&gt; $5 a|b snake_case _x_ ~")).toBe(
      "**x** 2\\*3 \\[a\\] \\<tag> \\$5 a\\|b snake_case \\_x\\_ \\~",
    )
  })

  test("escapes text that would start a block", () => {
    expect(htmlToMarkdown("<p># not a heading</p><p>- not a list</p><p>1. not a list</p><p><i>x</i></p>")).toBe(
      "\\# not a heading\n\n\\- not a list\n\n1\\. not a list\n\n*x*",
    )
  })

  test("returns null for HTML without formatting, so plain text is pasted", () => {
    expect(htmlToMarkdown("<p>just</p><div>text<br>here</div>")).toBeNull()
    expect(htmlToMarkdown('<meta charset="utf-8"><span>plain</span>')).toBeNull()
  })
})
