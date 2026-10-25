import { describe, expect, test } from "bun:test"
import { toTelegramHtml } from "./telegram-html"

describe("BOT-POSTS telegram html", () => {
  test("BOT-POSTS-1 writes bold, italic, underline and strike as Telegram tags", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "a", marks: [{ type: "bold" }] },
            { type: "text", text: "b", marks: [{ type: "italic" }] },
            { type: "text", text: "c", marks: [{ type: "underline" }] },
            { type: "text", text: "d", marks: [{ type: "strike" }] },
          ],
        },
      ],
    }

    expect(toTelegramHtml(doc)).toBe("<b>a</b><i>b</i><u>c</u><s>d</s>")
  })

  test("BOT-POSTS-2 escapes text and keeps a link only with an http(s) address", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: '1 < 2 & "x"' },
            { type: "text", text: "go", marks: [{ type: "link", attrs: { href: "https://iht.uz/?a=1&b=2" } }] },
            { type: "text", text: "bad", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
          ],
        },
      ],
    }

    expect(toTelegramHtml(doc)).toBe('1 &lt; 2 &amp; &quot;x&quot;<a href="https://iht.uz/?a=1&amp;b=2">go</a>bad')
  })

  test("BOT-POSTS-3 writes spoiler, code, blockquote and pre", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "hid", marks: [{ type: "spoiler" }] }],
            },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "code" }] }],
        },
        { type: "codeBlock", content: [{ type: "text", text: "let a = 1" }] },
      ],
    }

    expect(toTelegramHtml(doc)).toBe(
      "<blockquote><tg-spoiler>hid</tg-spoiler></blockquote>\n<code>x</code>\n<pre>let a = 1</pre>",
    )
  })

  test("BOT-POSTS-4 an empty document is an empty body", () => {
    expect(toTelegramHtml({ type: "doc", content: [{ type: "paragraph" }] })).toBe("")
  })
})
