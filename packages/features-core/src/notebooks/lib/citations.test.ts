import { describe, expect, test } from "bun:test"
import type { WebResult } from "@ihsp/api"
import {
  citedNumbers,
  citedWebNumbers,
  copyTextWithSources,
  markersToBrackets,
  splitCitations,
  stripCitations,
} from "./citations"

describe("splitCitations", () => {
  test("splits text around a single marker", () => {
    expect(splitCitations("Sugar from CO2 ⟦1⟧. Done.")).toEqual([
      { type: "text", text: "Sugar from CO2 " },
      { type: "marker", numbers: [1], raw: "⟦1⟧" },
      { type: "text", text: ". Done." },
    ])
  })

  test("reads grouped markers", () => {
    const parts = splitCitations("It runs in the stroma ⟦2,3⟧.")

    expect(parts[1]).toEqual({ type: "marker", numbers: [2, 3], raw: "⟦2,3⟧" })
  })

  test("keeps adjacent markers as separate parts without empty text between them", () => {
    const parts = splitCitations("a ⟦1⟧⟦2⟧")

    expect(parts.map((part) => part.type)).toEqual(["text", "marker", "marker"])
  })

  test("tolerates spaces inside the brackets", () => {
    expect(splitCitations("⟦ 4 , 5 ⟧")).toEqual([{ type: "marker", numbers: [4, 5], raw: "⟦ 4 , 5 ⟧" }])
  })

  test("returns plain text unchanged and nothing for an empty string", () => {
    expect(splitCitations("no markers")).toEqual([{ type: "text", text: "no markers" }])
    expect(splitCitations("")).toEqual([])
  })

  test("leaves broken markers as text", () => {
    expect(splitCitations("a ⟦x⟧ b ⟦1")).toEqual([{ type: "text", text: "a ⟦x⟧ b ⟦1" }])
  })

  test("reads a web marker", () => {
    expect(splitCitations("Plants make sugar ⟦w1⟧.")).toEqual([
      { type: "text", text: "Plants make sugar " },
      { type: "web", numbers: [1], raw: "⟦w1⟧" },
      { type: "text", text: "." },
    ])
  })

  test("reads grouped web markers", () => {
    expect(splitCitations("⟦w1,3⟧")).toEqual([{ type: "web", numbers: [1, 3], raw: "⟦w1,3⟧" }])
  })

  test("splits mixed text into text, source and web parts", () => {
    const parts = splitCitations("A ⟦1,2⟧ and B ⟦w2⟧⟦3⟧ end")

    expect(parts).toEqual([
      { type: "text", text: "A " },
      { type: "marker", numbers: [1, 2], raw: "⟦1,2⟧" },
      { type: "text", text: " and B " },
      { type: "web", numbers: [2], raw: "⟦w2⟧" },
      { type: "marker", numbers: [3], raw: "⟦3⟧" },
      { type: "text", text: " end" },
    ])
  })

  test("leaves broken web markers as text", () => {
    expect(splitCitations("a ⟦w⟧ b ⟦x1⟧ c")).toEqual([{ type: "text", text: "a ⟦w⟧ b ⟦x1⟧ c" }])
    expect(splitCitations("⟦w1,⟧ ⟦w1,x⟧ ⟦W⟧")).toEqual([{ type: "text", text: "⟦w1,⟧ ⟦w1,x⟧ ⟦W⟧" }])
  })
})

describe("markersToBrackets", () => {
  test("turns markers into [n] pairs for the clipboard", () => {
    expect(markersToBrackets("A ⟦1⟧. B ⟦1,2⟧.")).toBe("A [1]. B [1][2].")
  })

  test("turns web markers into [w1] pairs", () => {
    expect(markersToBrackets("A ⟦w1⟧. B ⟦w1,3⟧. C ⟦2⟧⟦w2⟧.")).toBe("A [w1]. B [w1][w3]. C [2][w2].")
  })

  test("leaves broken markers alone", () => {
    expect(markersToBrackets("A ⟦w⟧ ⟦x1⟧")).toBe("A ⟦w⟧ ⟦x1⟧")
  })
})

describe("stripCitations", () => {
  test("removes markers and the space before them", () => {
    expect(stripCitations("Sugar ⟦1⟧. More ⟦2,3⟧")).toBe("Sugar. More")
  })

  test("removes web markers and the space before them", () => {
    expect(stripCitations("Sugar ⟦w1⟧. More ⟦w1,3⟧ and ⟦2⟧ ⟦w2⟧")).toBe("Sugar. More and")
  })
})

describe("citedNumbers", () => {
  test("lists numbers in order of first appearance", () => {
    expect(citedNumbers("a ⟦2⟧ b ⟦1,2⟧ c ⟦3⟧")).toEqual([2, 1, 3])
  })

  test("counts source numbers only", () => {
    expect(citedNumbers("a ⟦w5⟧ b ⟦1⟧ ⟦w1,2⟧")).toEqual([1])
  })
})

describe("citedWebNumbers", () => {
  test("lists web numbers in order of first appearance and ignores source markers", () => {
    expect(citedWebNumbers("a ⟦w2⟧ b ⟦1⟧ ⟦w1,2⟧ c ⟦w3⟧")).toEqual([2, 1, 3])
    expect(citedWebNumbers("no web ⟦1⟧")).toEqual([])
  })
})

const page = (n: number): WebResult => ({
  n,
  title: `Page ${n}`,
  url: `https://example.org/${n}`,
  site: "example.org",
  snippet: "",
  why: "",
  cited: false,
})

describe("copyTextWithSources", () => {
  test("is the bracket text alone when the answer has no web markers", () => {
    expect(copyTextWithSources("A ⟦1⟧.", [page(1)], "Sources:")).toBe("A [1].")
  })

  test("appends the cited pages as a list of URLs", () => {
    const copied = copyTextWithSources("A ⟦w2⟧ B ⟦w1,2⟧.", [page(1), page(2), page(3)], "Sources:")

    expect(copied).toBe("A [w2] B [w1][w2].\n\nSources:\n[w2] https://example.org/2\n[w1] https://example.org/1")
  })

  test("skips markers without a result and adds no list when none resolves", () => {
    expect(copyTextWithSources("A ⟦w9⟧.", [page(1)], "Sources:")).toBe("A [w9].")
  })

  test("a long run of spaces inside an unfinished marker is parsed quickly", () => {
    const hostile = `⟦${" ".repeat(200_000)}w${" ".repeat(200_000)}x`
    const started = performance.now()
    expect(splitCitations(hostile)).toEqual([{ type: "text", text: hostile }])
    expect(markersToBrackets(hostile)).toBe(hostile)
    expect(performance.now() - started).toBeLessThan(1_000)
  })

  test("whitespace before a marker is removed by stripCitations, also on a long run of spaces", () => {
    const started = performance.now()
    expect(stripCitations(`sugar${" ".repeat(200_000)}⟦1⟧.`)).toBe("sugar.")
    expect(performance.now() - started).toBeLessThan(1_000)
  })

  test("a web marker with a space after the w still counts as a web marker", () => {
    expect(splitCitations("a ⟦w 2⟧")).toEqual([
      { type: "text", text: "a " },
      { type: "web", numbers: [2], raw: "⟦w 2⟧" },
    ])
  })
})
