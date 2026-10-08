import { describe, expect, it } from "bun:test"
import { RATINGS, isTypingTarget, ratingForKey } from "./study-keys"

describe("study keys (WEB-23, UF-WEB-22)", () => {
  it("maps keys 1 to 4 to Again, Hard, Medium and Easy", () => {
    expect(["1", "2", "3", "4"].map(ratingForKey)).toEqual(["again", "hard", "medium", "easy"])
    expect(RATINGS).toEqual(["again", "hard", "medium", "easy"])
  })

  it("ignores every other key", () => {
    expect(ratingForKey("5")).toBeUndefined()
    expect(ratingForKey("a")).toBeUndefined()
    expect(ratingForKey(" ")).toBeUndefined()
  })

  it("does not treat keys typed in a form field as shortcuts", () => {
    expect(isTypingTarget(document.createElement("textarea"))).toBe(true)
    expect(isTypingTarget(document.createElement("input"))).toBe(true)
    expect(isTypingTarget(document.createElement("button"))).toBe(false)
    expect(isTypingTarget(null)).toBe(false)
  })
})
