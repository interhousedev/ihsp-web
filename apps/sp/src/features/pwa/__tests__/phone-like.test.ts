import { describe, expect, test } from "bun:test"
import { looksLikePhone } from "../utils/phone-like"

const media = (matches: string[]) => (query: string) => ({ matches: matches.includes(query) })
const desktopUa = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"

describe("looksLikePhone", () => {
  test("a desktop browser is not a phone", () => {
    expect(looksLikePhone({ userAgent: desktopUa, matchMedia: media([]) })).toBe(false)
  })
  test("a mobile user agent is a phone", () => {
    expect(looksLikePhone({ userAgent: `${desktopUa} Mobile`, matchMedia: media([]) })).toBe(true)
  })
  test("a narrow touch screen is a phone, a wide one is not", () => {
    const narrow = media(["(pointer: coarse)", "(max-width: 820px)"])
    expect(looksLikePhone({ userAgent: desktopUa, maxTouchPoints: 5, matchMedia: narrow })).toBe(true)
    expect(looksLikePhone({ userAgent: desktopUa, maxTouchPoints: 5, matchMedia: media(["(pointer: coarse)"]) })).toBe(
      false,
    )
  })
})
