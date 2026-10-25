import { describe, expect, it } from "bun:test"
import { safeHttpUrl } from "../lib/safe-http-url"

describe("safeHttpUrl", () => {
  it("keeps absolute http and https URLs", () => {
    expect(safeHttpUrl("https://hydra.example/logout?x=1")).toBe("https://hydra.example/logout?x=1")
    expect(safeHttpUrl("http://files.example/a.pdf")).toBe("http://files.example/a.pdf")
  })

  it("drops script, data, relative and empty values", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeUndefined()
    expect(safeHttpUrl("data:text/html,hi")).toBeUndefined()
    expect(safeHttpUrl("/relative/")).toBeUndefined()
    expect(safeHttpUrl("")).toBeUndefined()
    expect(safeHttpUrl(null)).toBeUndefined()
    expect(safeHttpUrl(undefined)).toBeUndefined()
  })
})
