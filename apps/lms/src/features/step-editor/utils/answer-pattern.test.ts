import { describe, expect, it } from "bun:test"
import { buildPattern, parsePattern } from "./answer-pattern"

describe("answer pattern", () => {
  it("builds each mode", () => {
    expect(buildPattern("exact", "cat")).toBe("cat")
    expect(buildPattern("contains", "cat")).toBe(".*cat.*")
    expect(buildPattern("startsWith", "cat")).toBe("cat.*")
    expect(buildPattern("endsWith", "cat")).toBe(".*cat")
  })
  it("round-trips every mode, including regex characters", () => {
    for (const mode of ["exact", "contains", "startsWith", "endsWith"] as const) {
      for (const text of ["cat", "a.b*c", "(x)+[y]", "back\\slash", "1+1=2?", "end."]) {
        expect(parsePattern(buildPattern(mode, text))).toEqual({ mode, text })
      }
    }
  })
  it("escapes metacharacters", () => {
    expect(buildPattern("exact", "a.b")).toBe("a\\.b")
  })
  it("falls back to advanced for hand-written expressions", () => {
    for (const raw of ["\\d+", "a|b", "[a-z]+", "(?i)cat", ".*", "", "a.+"]) {
      expect(parsePattern(raw)).toBeNull()
    }
  })
})
