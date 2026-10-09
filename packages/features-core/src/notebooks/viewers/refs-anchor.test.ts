import { describe, expect, it } from "bun:test"
import type { RefsIndex } from "@ihsp/api"
import { anchorFromRefs } from "./refs-anchor"

const entry = (passage: string) => ({
  passage_id: passage,
  source_id: "s1",
  source_title: "Biology",
  source_kind: "file" as const,
  page: 1,
  snippet: "…",
})
const index: RefsIndex = { "S1:P1": entry("p1"), "S1:P2": entry("p2"), "S2:P1": entry("p1") }

describe("anchorFromRefs", () => {
  it("resolves labels to passage ids without duplicates", () => {
    expect(anchorFromRefs(["S1:P1", "S1:P2", "S2:P1"], index)).toEqual({ kind: "passages", ids: ["p1", "p2"] })
  })

  it("skips labels that are not in the index", () => {
    expect(anchorFromRefs(["S9:P9", "S1:P2"], index)).toEqual({ kind: "passages", ids: ["p2"] })
  })

  it("gives no anchor when nothing resolves", () => {
    expect(anchorFromRefs(["S9:P9"], index)).toBeUndefined()
    expect(anchorFromRefs([], index)).toBeUndefined()
  })
})
