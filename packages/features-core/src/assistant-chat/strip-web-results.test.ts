import { describe, expect, it } from "bun:test"
import { stripWebResults } from "./assistant-message"

describe("stripWebResults", () => {
  it("removes a web_results block", () => {
    expect(stripWebResults("Hi <web_results>\n- a\n</web_results> there")).toBe("Hi  there")
  })
  it("removes the search-results header line", () => {
    expect(stripWebResults("[Web search results for this message, 3]\nAnswer")).toBe("Answer")
  })
  it("keeps clean text", () => {
    expect(stripWebResults("Plain answer")).toBe("Plain answer")
  })
})
