import { describe, expect, it } from "bun:test"
import { highlightParts, matches, normalizeSearch } from "./search-text"

describe("normalizeSearch", () => {
  it("lower-cases and folds Cyrillic letters to the Uzbek Latin alphabet", () => {
    expect(normalizeSearch("Ўзбекистон")).toBe("o'zbekiston")
    expect(normalizeSearch("қалам ғоя ҳаво")).toBe("qalam g'oya havo")
    expect(normalizeSearch("шаҳар чой ёш юлдуз яхши эшик цирк")).toBe("shahar choy yosh yulduz yaxshi eshik tsirk")
  })

  it("folds the hard sign to an apostrophe and drops the soft sign", () => {
    expect(normalizeSearch("маъно")).toBe("ma'no")
    expect(normalizeSearch("кальций")).toBe("kaltsiy")
  })

  it("folds the regular Russian letters too", () => {
    expect(normalizeSearch("Фотосинтез и дыхание")).toBe("fotosintez i dixanie")
  })

  it("turns every apostrophe form into one", () => {
    for (const form of ["oʻ", "o'", "o‘", "o’", "oʼ", "o`", "o´"]) {
      expect(normalizeSearch(`${form}zbek`)).toBe("o'zbek")
    }
  })

  it("drops diacritics and composes split letters before folding", () => {
    expect(normalizeSearch("Café")).toBe("cafe")
    // "й" written as "и" + a combining breve
    expect(normalizeSearch("й")).toBe("y")
  })
})

describe("matches", () => {
  it("finds a Latin Uzbek title with a Cyrillic query", () => {
    expect(matches("Oʻzbekiston tarixi", "ўзбекистон")).toBe(true)
    expect(matches("Qalam va daftar", "қалам")).toBe(true)
  })

  it("finds a Cyrillic title with a Latin query", () => {
    expect(matches("Тошкент шаҳри", "toshkent")).toBe(true)
    expect(matches("Ўзбек тили", "o'zbek")).toBe(true)
  })

  it("does not care about the apostrophe form", () => {
    for (const query of ["oʻzbek", "o'zbek", "o‘zbek", "o’zbek", "O`zbek"]) {
      expect(matches("Oʻzbek tili", query)).toBe(true)
      expect(matches("O'zbek tili", query)).toBe(true)
    }
  })

  it("needs every word of the query, in any order", () => {
    expect(matches("Biology 10.pdf", "10 biology")).toBe(true)
    expect(matches("Biology 10.pdf", "biology chemistry")).toBe(false)
  })

  it("matches everything for an empty query", () => {
    expect(matches("Anything", "")).toBe(true)
    expect(matches("Anything", "   ")).toBe(true)
  })
})

describe("highlightParts", () => {
  const joined = (parts: ReturnType<typeof highlightParts>) => parts.map((part) => part.text).join("")
  const marked = (parts: ReturnType<typeof highlightParts>) => parts.filter((part) => part.match).map((p) => p.text)

  it("marks the query words in the original text, ignoring case", () => {
    const parts = highlightParts("The Calvin cycle takes place in the stroma.", "calvin STROMA")

    expect(joined(parts)).toBe("The Calvin cycle takes place in the stroma.")
    expect(marked(parts)).toEqual(["Calvin", "stroma"])
  })

  it("finds a Latin word with a Cyrillic query and marks the whole original letters", () => {
    const parts = highlightParts("Shahar va qishloq", "шаҳар")

    expect(marked(parts)).toEqual(["Shahar"])
  })

  it("merges overlapping hits and returns a single plain part without a query", () => {
    expect(marked(highlightParts("photosynthesis", "photo synth"))).toEqual(["photosynth"])
    expect(highlightParts("photosynthesis", "")).toEqual([{ text: "photosynthesis", match: false }])
  })

  it("does not mark single letters of a multi-word query", () => {
    expect(marked(highlightParts("a cat sat", "a cat"))).toEqual(["cat"])
  })
})
