import { describe, expect, test } from "bun:test"
import { stringsInBlock } from "./safe"

describe("stringsInBlock", () => {
  test("reads the quoted strings of a block, with escapes decoded", () => {
    expect(stringsInBlock('Card("Hi \\"there\\"", "Line\\nTwo")')).toEqual(['Hi "there"', "Line\nTwo"])
  })

  test("skips links", () => {
    expect(stringsInBlock('Link("https://example.org", "Open")')).toEqual(["Open"])
  })

  test("a long run of escaped backslashes without a closing quote is read quickly", () => {
    const hostile = `"${"\\\\".repeat(100_000)}`
    const started = performance.now()
    expect(stringsInBlock(hostile)).toEqual([])
    expect(performance.now() - started).toBeLessThan(1_000)
  })

  test("a long run of plain characters followed by an unclosed quote is read quickly", () => {
    const hostile = `"${"a".repeat(200_000)}\n"${"b".repeat(200_000)}`
    const started = performance.now()
    expect(stringsInBlock(hostile)).toEqual([]) // a string may not span a newline, and neither quote is closed
    expect(performance.now() - started).toBeLessThan(1_000)
  })
})
