import { describe, expect, test } from "bun:test"
import { isSceneBreak, splitBlocks } from "./blocks"

const texts = (body: string) => splitBlocks(body).map((b) => [b.kind, body.slice(b.start, b.end)])

describe("essay blocks", () => {
  test("scene breaks", () => {
    for (const l of ["* * *", "***", "---", "___", "###", "~~~", "•••", "* * * *", "— — —", "§", " ... "])
      expect(isSceneBreak(l)).toBe(true)
    for (const l of ["", "   ", "Hello", "- item", "1.", "* * * * * * * * * * *"]) expect(isSceneBreak(l)).toBe(false)
  })

  test("blank-line split, empty blocks dropped", () => {
    const body = "  One two\n\n\nThree\n \nFour\n"
    const ps = splitBlocks(body)
    expect(ps.map((b) => body.slice(b.start, b.end))).toEqual(["One two", "Three", "Four"])
    expect(splitBlocks("  \n\n ")).toEqual([])
  })

  test("a break without blank lines splits and is not numbered", () => {
    const body = "One\n* * *\nTwo\nlines"
    expect(texts(body)).toEqual([
      ["paragraph", "One"],
      ["transition", "* * *"],
      ["paragraph", "Two\nlines"],
    ])
    const ns = splitBlocks("One\n\n***\n\nTwo\n---\n---\nThree").flatMap((b) => (b.kind === "paragraph" ? [b.n] : []))
    expect(ns).toEqual([1, 2, 3])
  })
})
