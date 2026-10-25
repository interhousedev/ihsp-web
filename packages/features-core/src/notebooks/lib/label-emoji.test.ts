import { describe, expect, it } from "bun:test"
import { labelEmoji } from "./label-emoji"

describe("labelEmoji", () => {
  it("keeps a real emoji", () => {
    expect(labelEmoji({ id: "a", emoji: "📘" })).toBe("📘")
  })

  it("replaces the generic tag with a stable colour square", () => {
    const first = labelEmoji({ id: "label-1", emoji: "🏷️" })
    expect(first).toMatch(/^[🟦🟩🟧🟪🟥🟨🟫]$/u)
    expect(labelEmoji({ id: "label-1", emoji: "🏷️" })).toBe(first)
  })

  it("separates the generic tags of different labels", () => {
    const ids = ["x1", "x2", "x3", "x4", "x5"]
    const squares = new Set(ids.map((id) => labelEmoji({ id, emoji: "🏷️" })))
    expect(squares.size).toBeGreaterThan(1)
  })
})
