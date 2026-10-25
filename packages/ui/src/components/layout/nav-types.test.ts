import { describe, expect, test } from "bun:test"
import { normalizePath } from "./nav-types"

describe("normalizePath", () => {
  test("drops the query, the hash and trailing slashes; the root stays", () => {
    expect(normalizePath("/timetable/?week=1#top")).toBe("/timetable")
    expect(normalizePath("/")).toBe("/")
    expect(normalizePath("///")).toBe("/")
  })

  test("a very long run of trailing slashes is trimmed quickly", () => {
    const started = performance.now()
    expect(normalizePath(`/a${"/".repeat(200_000)}`)).toBe("/a")
    expect(performance.now() - started).toBeLessThan(1_000)
  })
})
