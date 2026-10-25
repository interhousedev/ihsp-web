import { describe, expect, it } from "bun:test"
import { formatBytes } from "../lib/utils"

describe("formatBytes", () => {
  it("is the one platform formatter: whole bytes below 1 KB, at most one decimal above", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(2 * 1024 * 1024)).toBe("2 MB")
    expect(formatBytes(20 * 1024 * 1024)).toBe("20 MB")
    expect(formatBytes(482_113)).toBe("470.8 KB")
    expect(formatBytes(5_368_709_120)).toBe("5 GB")
    expect(formatBytes(-5)).toBe("0 B")
  })
})
