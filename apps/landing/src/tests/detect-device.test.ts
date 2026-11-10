import { describe, expect, test } from "bun:test"
import { detectDevice, type DeviceSignals } from "../features/landing/detect-device"

const base: DeviceSignals = { userAgent: "", coarsePointer: false, width: 1440 }

describe("detectDevice", () => {
  test("client hints: mobile is a phone", () => {
    expect(detectDevice({ ...base, uaData: { mobile: true, platform: "Android" } })).toBe("phone")
  })
  test("client hints: desktop platforms are laptops", () => {
    for (const platform of ["macOS", "Windows", "Linux", "Chrome OS"]) {
      expect(detectDevice({ ...base, uaData: { mobile: false, platform } })).toBe("laptop")
    }
  })
  test("client hints: non-mobile Android is a tablet", () => {
    expect(detectDevice({ ...base, uaData: { mobile: false, platform: "Android" } })).toBe("tablet")
  })
  test("iPadOS in desktop mode is a tablet", () => {
    const uaData = { mobile: false, platform: "macOS" }
    expect(detectDevice({ ...base, uaData, coarsePointer: true, maxTouchPoints: 5 })).toBe("tablet")
  })
  test("user agent fallbacks", () => {
    expect(detectDevice({ ...base, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)" })).toBe("phone")
    expect(detectDevice({ ...base, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel) Mobile Safari" })).toBe("phone")
    expect(detectDevice({ ...base, userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0)" })).toBe("tablet")
    expect(detectDevice({ ...base, userAgent: "Mozilla/5.0 (Linux; Android 14; SM-X900) Safari" })).toBe("tablet")
    expect(detectDevice({ ...base, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)", maxTouchPoints: 5 })).toBe(
      "tablet",
    )
    expect(detectDevice({ ...base, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)" })).toBe("laptop")
  })
  test("pointer and width when the UA says nothing", () => {
    expect(detectDevice({ ...base, coarsePointer: true, width: 390 })).toBe("phone")
    expect(detectDevice({ ...base, coarsePointer: true, width: 820 })).toBe("tablet")
    expect(detectDevice({ ...base, coarsePointer: true, width: 1366 })).toBe("laptop")
    expect(detectDevice({ ...base, width: 390 })).toBe("laptop")
  })
})
