import { describe, expect, it } from "bun:test"
import { parseShareInput } from "./share-input"

describe("parseShareInput", () => {
  it("takes the slug of a share link", () => {
    expect(parseShareInput("https://share.ihsp.uz/ai/zr5t8w1c/")).toBe("zr5t8w1c")
    expect(parseShareInput("  https://share.ihsp.uz/ai/zr5t8w1c  ")).toBe("zr5t8w1c")
  })

  it("accepts a path or a bare slug", () => {
    expect(parseShareInput("/ai/zr5t8w1c/")).toBe("zr5t8w1c")
    expect(parseShareInput("zr5t8w1c")).toBe("zr5t8w1c")
  })

  it("rejects empty input, extra path segments and text with spaces", () => {
    expect(parseShareInput("")).toBeNull()
    expect(parseShareInput("   ")).toBeNull()
    expect(parseShareInput("https://share.ihsp.uz/ai/a/b/")).toBeNull()
    expect(parseShareInput("not a link")).toBeNull()
  })
})
