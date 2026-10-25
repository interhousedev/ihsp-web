import { describe, expect, it } from "bun:test"
import { splitOpenUi } from "./split"

describe("OPENUI-1 splitOpenUi", () => {
  it("returns one markdown segment when there is no block", () => {
    expect(splitOpenUi("Hello **world**")).toEqual([{ kind: "markdown", text: "Hello **world**" }])
  })

  it("returns nothing for an empty text", () => {
    expect(splitOpenUi("")).toEqual([])
  })

  it("splits text, one block and the text after it", () => {
    const text = "Before\n\n```openui\nroot = Stack([])\n```\n\nAfter"
    expect(splitOpenUi(text)).toEqual([
      { kind: "markdown", text: "Before\n\n" },
      { kind: "block", code: "root = Stack([])" },
      { kind: "markdown", text: "\nAfter" },
    ])
  })

  it("splits two blocks", () => {
    const text = "```openui\na\n```\ntext\n```openui\nb\n```"
    const kinds = splitOpenUi(text).map((s) => s.kind)
    expect(kinds).toEqual(["block", "markdown", "block"])
  })

  it("marks an unclosed trailing fence as pending", () => {
    const segments = splitOpenUi("Intro\n```openui\nroot = Stack([Tex")
    expect(segments).toEqual([{ kind: "markdown", text: "Intro\n" }, { kind: "pending" }])
  })

  it("leaves other fences to markdown", () => {
    const text = "```python\nprint(1)\n```"
    expect(splitOpenUi(text)).toEqual([{ kind: "markdown", text }])
  })
})
