import { describe, expect, test } from "bun:test"
import type { DeepRead } from "../../flow/steps-api"
import { findQuote, locateMoments, splitParagraphs } from "./paragraphs"

describe("paragraph model", () => {
  test("splits on blank lines like the server and ignores empty blocks", () => {
    const body = "  One two\n\n\nThree\n \nFour\n"
    const spans = splitParagraphs(body)
    expect(spans.map((s) => body.slice(s.start, s.end))).toEqual(["One two", "Three", "Four"])
    expect(spans.map((s) => s.n)).toEqual([1, 2, 3])
    expect(splitParagraphs("  \n\n ")).toEqual([])
  })

  test("a quote matches across whitespace and case, its paragraph first", () => {
    const body = "alpha beta\n\nalpha beta gamma"
    const spans = splitParagraphs(body)
    expect(findQuote(body, "ALPHA   beta", spans[1])).toEqual([12, 22])
    expect(findQuote(body, "alpha (beta", spans[0])).toBeNull()
    expect(findQuote(body, "gamma", spans[0])).toEqual([23, 28])
  })

  test("moments that are missing or overlap are dropped", () => {
    const body = "One two three\n\nFour five"
    const spans = splitParagraphs(body)
    const read = {
      moments: [
        { paragraph: 1, quote: "two three", kind: "fresh" },
        { paragraph: 1, quote: "three", kind: "earned" },
        { paragraph: 2, quote: "absent words", kind: "fresh" },
      ],
    } as unknown as DeepRead
    const found = locateMoments(body, read, spans)
    expect(found).toHaveLength(1)
    expect(body.slice(found[0]!.start, found[0]!.end)).toBe("two three")
  })
})
