import { describe, expect, it } from "bun:test"
import type { StepContent } from "@ihsp/api"
import { diffBlocks, hasContentChanges, jsonEqual } from "../features/shared/utils/block-diff"

const text = (id: string, markdown: string) => ({ id, type: "text" as const, markdown })

describe("diffBlocks", () => {
  const live: StepContent = { title: "Step", blocks: [text("b1", "one"), text("b2", "two"), text("b3", "three")] }

  it("marks same, changed, added and removed blocks in draft order", () => {
    const draft: StepContent = { title: "Step", blocks: [text("b1", "one"), text("b2", "TWO"), text("b4", "four")] }
    const rows = diffBlocks(live, draft)
    expect(rows.map((row) => [row.id, row.status])).toEqual([
      ["b1", "same"],
      ["b2", "changed"],
      ["b3", "removed"],
      ["b4", "added"],
    ])
  })

  it("treats everything as added when there is no live content", () => {
    expect(diffBlocks(null, live).every((row) => row.status === "added")).toBe(true)
    expect(hasContentChanges(null, live)).toBe(true)
  })

  it("sees a changed title and ignores key order", () => {
    expect(hasContentChanges(live, { ...live, title: "Other" })).toBe(true)
    expect(hasContentChanges(live, structuredClone(live))).toBe(false)
    expect(jsonEqual({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 })).toBe(true)
    expect(jsonEqual({ a: 1 }, { a: 2 })).toBe(false)
  })
})
