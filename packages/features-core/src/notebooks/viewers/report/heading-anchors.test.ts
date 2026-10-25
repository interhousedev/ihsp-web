import { describe, expect, it } from "bun:test"
import { matchHeadings } from "./heading-anchors"

const headings = [
  { text: "Photosynthesis", id: "photosynthesis" },
  { text: "Main idea", id: "main-idea" },
  { text: "Examples", id: "examples" },
  { text: "Examples", id: "examples-2" },
  { text: "1. The **chloroplast**", id: "1-the-chloroplast" },
]

describe("matchHeadings", () => {
  it("maps the rendered headings to the ids of the content in order", () => {
    expect(matchHeadings(["Photosynthesis", "Main idea"], headings)).toEqual(["photosynthesis", "main-idea"])
  })

  it("gives repeated titles their own entries", () => {
    expect(matchHeadings(["Examples", "Examples"], headings)).toEqual(["examples", "examples-2"])
  })

  it("ignores case, punctuation and Markdown marks", () => {
    expect(matchHeadings(["1. The chloroplast", "MAIN IDEA!"], headings)).toEqual(["1-the-chloroplast", null])
  })

  it("leaves a heading that has no entry without an id and keeps the others", () => {
    expect(matchHeadings(["Photosynthesis", "Unknown", "Examples"], headings)).toEqual([
      "photosynthesis",
      null,
      "examples",
    ])
  })

  it("works with Cyrillic and Uzbek letters", () => {
    const list = [
      { text: "Основная идея", id: "a" },
      { text: "Oʻzbekiston tarixi", id: "b" },
    ]
    expect(matchHeadings(["Основная идея", "oʻzbekiston tarixi"], list)).toEqual(["a", "b"])
  })
})
