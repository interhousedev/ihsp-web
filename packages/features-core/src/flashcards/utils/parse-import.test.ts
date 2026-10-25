import { describe, expect, it } from "bun:test"
import { detectSeparator, looksLikeImport, parseImport } from "./parse-import"

describe("parseImport", () => {
  it("reads one card per line, term and definition split at the tab", () => {
    const { cards, skipped } = parseImport("cat\tкошка\r\ndog\tсобака\n\n  bird \t птица  ")

    expect(cards).toEqual([
      { front: "cat", back: "кошка" },
      { front: "dog", back: "собака" },
      { front: "bird", back: "птица" },
    ])
    expect(skipped).toBe(0)
  })

  it("splits at the first separator only, so a definition may contain it", () => {
    expect(parseImport("a=b\tc\td").cards).toEqual([{ front: "a=b", back: "c\td" }])
  })

  it("skips lines without a separator or with an empty side", () => {
    const { cards, skipped } = parseImport("no separator\n\tonly back\nonly front\t\nok\tfine")

    expect(cards).toEqual([{ front: "ok", back: "fine" }])
    expect(skipped).toBe(3)
  })

  it("supports commas and semicolons and unquotes CSV fields", () => {
    expect(parseImport('"one, two",three', "comma").cards).toEqual([{ front: "one, two", back: "three" }])
    expect(parseImport("a;b,c", "semicolon").cards).toEqual([{ front: "a", back: "b,c" }])
  })

  it("strips a byte order mark", () => {
    expect(parseImport("﻿a\tb").cards).toEqual([{ front: "a", back: "b" }])
  })

  it("skips a side longer than the limit", () => {
    expect(parseImport(`${"x".repeat(2001)}\tb`)).toEqual({ cards: [], skipped: 1 })
  })
})

describe("looksLikeImport", () => {
  it("is true for text with a term, a tab and a definition", () => {
    expect(looksLikeImport("a\tb")).toBe(true)
    expect(looksLikeImport("a\tb\nc\td")).toBe(true)
  })

  it("is false for ordinary text", () => {
    expect(looksLikeImport("just a sentence")).toBe(false)
    expect(looksLikeImport("two\nlines")).toBe(false)
    expect(looksLikeImport("\tstarts with a tab")).toBe(false)
  })
})

describe("detectSeparator", () => {
  it("prefers tabs, then semicolons, then commas", () => {
    expect(detectSeparator("a\tb")).toBe("tab")
    expect(detectSeparator("a;b,c")).toBe("semicolon")
    expect(detectSeparator("a,b")).toBe("comma")
    expect(detectSeparator("plain")).toBe("tab")
  })
})
