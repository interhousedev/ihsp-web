import { describe, expect, it } from "bun:test"
import { infographicContent } from "@ihsp/test-utils"
import { infographicToText } from "./infographic-text"

describe("infographicToText", () => {
  const text = infographicToText(infographicContent)

  it("starts with the title and subtitle and ends with the footer", () => {
    const lines = text.split("\n")
    expect(lines.slice(0, 2)).toEqual(["Photosynthesis at a glance", "Grade 10"])
    expect(lines.at(-1)).toBe("Source: Biology 10.pdf")
  })

  it("numbers the steps and bullets the other items", () => {
    expect(text).toContain("Process\n1. Absorb light: Chlorophyll captures it\n2. Split water: Releases O2")
    expect(text).toContain("Limiting factors\n- Light\n- CO2")
  })

  it("writes the columns of a comparison", () => {
    expect(text).toContain("Two stages\nLight\n- Thylakoid\n- Needs light\nCalvin\n- Stroma")
  })
})
