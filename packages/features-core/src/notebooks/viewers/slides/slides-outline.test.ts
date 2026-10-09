import { describe, expect, it } from "bun:test"
import { slidesContent } from "@ihsp/test-utils"
import { slidesToOutline } from "./slides-outline"

describe("slidesToOutline", () => {
  const outline = slidesToOutline(slidesContent, slidesContent.slides, { notes: "Notes" })

  it("starts with the deck title and subtitle", () => {
    expect(outline.split("\n").slice(0, 2)).toEqual(["Photosynthesis", "Grade 10 biology"])
  })

  it("numbers the slides and lists their bullets", () => {
    expect(outline).toContain("2. Two stages\n   - Light reactions\n   - Calvin cycle\n   Notes: Name both stages.")
  })

  it("writes columns, quotes and tables", () => {
    expect(outline).toContain("   Light reactions\n     - Thylakoids")
    expect(outline).toContain(
      "4. Stage two does not need light directly.\n   > Stage two does not need light directly.",
    )
    expect(outline).toContain("   Stage | Where\n   Light | Thylakoid")
  })

  it("leaves out the notes line of a slide without notes", () => {
    expect(outline).toContain("5. Summary table\n   Stage | Where\n   Light | Thylakoid\n   Calvin | Stroma\n6.")
  })
})
