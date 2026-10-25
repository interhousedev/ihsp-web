import { describe, expect, it } from "bun:test"
import { findQuoteRange, rangeBoxes } from "./quote-range"

function layer(...spans: string[]): HTMLElement {
  const root = document.createElement("div")
  for (const text of spans) {
    const span = document.createElement("span")
    span.textContent = text
    root.append(span, document.createElement("br"))
  }
  document.body.append(root)
  return root
}

describe("findQuoteRange", () => {
  it("finds a quote inside one span", () => {
    const root = layer("Intro", "The velocity of a body is the rate of change of its position.", "Outro")

    const range = findQuoteRange(root, "The velocity of a body is the rate of change of its position.")

    expect(range?.toString()).toBe("The velocity of a body is the rate of change of its position.")
  })

  it("finds a quote that runs over several lines of a text layer", () => {
    const root = layer("Acceleration is the rate", "of change of velocity.")

    // A selection joins the lines with a new line; the text layer has no separator.
    const range = findQuoteRange(root, "Acceleration is the rate\nof change of velocity.")

    expect(range?.toString().replaceAll(/\s/g, "")).toBe("Accelerationistherateofchangeofvelocity.")
  })

  it("finds a quote cut in the middle of a word by the PDF text items", () => {
    const root = layer("The Veloc", "ity of light")

    expect(findQuoteRange(root, "Velocity of light")?.toString()).toBe("Velocity of light")
  })

  it("ignores case and the quote's extra spaces", () => {
    const root = layer("A net force produces acceleration.")

    expect(findQuoteRange(root, "  a NET   force produces  ")?.toString()).toBe("A net force produces")
  })

  it("finds nothing for text that is not there or is too short to mean anything", () => {
    const root = layer("Hello world")

    expect(findQuoteRange(root, "Goodbye")).toBeNull()
    expect(findQuoteRange(root, "H")).toBeNull()
    expect(findQuoteRange(root, "   ")).toBeNull()
  })

  it("works with Cyrillic and astral characters", () => {
    const root = layer("Отабек Тошкентдан келди.", "A \u{1D400}B quote")

    expect(findQuoteRange(root, "отабек тошкентдан")?.toString()).toBe("Отабек Тошкентдан")
    expect(findQuoteRange(root, "\u{1D400}B quote")?.toString()).toBe("\u{1D400}B quote")
  })
})

describe("rangeBoxes", () => {
  it("is empty where the layout engine reports no rectangles", () => {
    const root = layer("Some text on a page")
    const range = findQuoteRange(root, "text on")!

    expect(rangeBoxes(range, new DOMRect(0, 0, 100, 100))).toEqual([])
  })
})
