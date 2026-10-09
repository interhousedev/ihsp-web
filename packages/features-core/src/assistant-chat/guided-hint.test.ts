import { describe, expect, it } from "bun:test"
import { splitGuidedHint, withGuidedHint } from "./guided-hint"

describe("guided learning hint", () => {
  it("prefixes the text with the hint line and splits it off again", () => {
    const sent = withGuidedHint("Guide me.", "What is a vector?")

    expect(sent).toBe("Guide me.\n\nWhat is a vector?")
    expect(splitGuidedHint("Guide me.", sent)).toEqual({ guided: true, text: "What is a vector?" })
  })

  it("leaves other messages as they are", () => {
    expect(splitGuidedHint("Guide me.", "What is a vector?")).toEqual({ guided: false, text: "What is a vector?" })
  })
})
