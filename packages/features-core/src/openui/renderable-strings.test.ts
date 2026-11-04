import { describe, expect, it } from "bun:test"
import { withoutStringText } from "./renderable"

describe("withoutStringText", () => {
  it("removes the text of closed strings, escapes included", () => {
    expect(withoutStringText('a = "cost $5 \\" @b" + "x"')).toBe('a = "" + ""')
  })

  it("keeps a line with an unclosed quote as code, so state references stay visible", () => {
    expect(withoutStringText('a = "open $state\nb = "ok"')).toBe('a = "open $state\nb = ""')
    expect(withoutStringText('a = "ends with \\')).toBe('a = "ends with \\')
  })

  it("stays fast on a long run of escaped quotes without a closing quote", () => {
    const input = `"${'\\"'.repeat(200_000)}`
    const start = performance.now()
    expect(withoutStringText(input)).toBe(input)
    expect(performance.now() - start).toBeLessThan(1000)
  })
})
