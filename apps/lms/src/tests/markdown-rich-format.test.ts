import { describe, expect, it } from "bun:test"
import {
  alignmentAt,
  colorAt,
  insertImage,
  insertTable,
  setAlignment,
  setColor,
} from "../features/step-editor/utils/markdown/rich-format"

const at = (text: string, start: number, end = start) => ({ text, start, end })

describe("colour", () => {
  it("wraps the selection in a colour span", () => {
    const next = setColor(at("a word b", 2, 6), "red")
    expect(next.text).toBe('a <span class="c-red">word</span> b')
    expect(colorAt(next)).toBe("red")
  })

  it("recolours and removes the colour of a span", () => {
    const text = 'a <span class="c-red">word</span> b'
    const inside = at(text, text.indexOf("word"), text.indexOf("word") + 4)
    expect(setColor(inside, "blue").text).toBe('a <span class="c-blue">word</span> b')
    expect(setColor(inside, null).text).toBe("a word b")
  })

  it("does nothing without a selection", () => {
    expect(setColor(at("abc", 1), "red").text).toBe("abc")
  })
})

describe("alignment", () => {
  it("centres a paragraph and takes it back", () => {
    const centred = setAlignment(at("Hello", 2), "center")
    expect(centred.text).toBe("<align-center>Hello</align-center>")
    expect(alignmentAt(centred)).toBe("center")
    expect(setAlignment(centred, "left").text).toBe("Hello")
  })

  it("keeps heading and list marks outside the tags and replaces the old alignment", () => {
    expect(setAlignment(at("## Title", 3), "right").text).toBe("## <align-right>Title</align-right>")
    expect(setAlignment(at("- item", 3), "center").text).toBe("- <align-center>item</align-center>")
    expect(setAlignment(at("<align-right>x</align-right>", 15), "center").text).toBe("<align-center>x</align-center>")
  })

  it("leaves code and tables alone", () => {
    const code = "```\nx\n```"
    expect(setAlignment(at(code, 5), "center").text).toBe(code)
    expect(setAlignment(at("| a |", 2), "center").text).toBe("| a |")
  })
})

describe("insertions", () => {
  it("inserts a table on its own lines with the first header selected", () => {
    const next = insertTable(at("before", 6))
    expect(next.text).toBe("before\n\n| H1 | H2 |\n| --- | --- |\n|   |   |\n|   |   |")
    expect(next.text.slice(next.start, next.end)).toBe("H1")
  })

  it("inserts an uploaded image as Markdown", () => {
    const next = insertImage(at("x ", 2), "photo [1]", "/files/abc")
    expect(next.text).toBe("x ![photo 1](/files/abc)")
    expect(next.start).toBe(next.text.length)
  })
})
