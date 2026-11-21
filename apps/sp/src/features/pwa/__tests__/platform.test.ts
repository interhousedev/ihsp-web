/** Which instructions a device gets, and whether the page already runs as an installed app. */
import { describe, expect, test } from "bun:test"
import { detectPlatform, isInAppBrowser, isStandaloneDisplay } from "../utils/platform"

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15"

describe("detectPlatform", () => {
  test("iPhone and iPad", () => {
    expect(detectPlatform({ userAgent: IPHONE })).toBe("ios")
    expect(detectPlatform({ userAgent: "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X)" })).toBe("ios")
  })

  test("iPadOS pretends to be a Mac, but has a touch screen", () => {
    expect(detectPlatform({ userAgent: MAC, platform: "MacIntel", maxTouchPoints: 5 })).toBe("ios")
    expect(detectPlatform({ userAgent: MAC, platform: "MacIntel", maxTouchPoints: 0 })).toBe("desktop")
  })

  test("Android and everything else", () => {
    expect(detectPlatform({ userAgent: ANDROID })).toBe("android")
    expect(detectPlatform({ userAgent: MAC })).toBe("desktop")
  })
})

describe("isInAppBrowser", () => {
  test("Telegram, Instagram and Android WebViews cannot add to the home screen", () => {
    expect(isInAppBrowser(`${IPHONE} Telegram`)).toBe(true)
    expect(isInAppBrowser(`${IPHONE} Instagram 320.0`)).toBe(true)
    expect(
      isInAppBrowser("Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36"),
    ).toBe(true)
  })

  test("a real browser is not one", () => {
    expect(isInAppBrowser(IPHONE)).toBe(false)
    expect(isInAppBrowser(ANDROID)).toBe(false)
  })
})

const none = () => ({ matches: false })
const standaloneOnly = (query: string) => ({ matches: query === "(display-mode: standalone)" })

describe("isStandaloneDisplay", () => {
  test("a browser tab is not standalone", () => {
    expect(isStandaloneDisplay({ matchMedia: none, navigator: {} })).toBe(false)
  })

  test("display-mode standalone (Android, desktop)", () => {
    expect(isStandaloneDisplay({ matchMedia: standaloneOnly, navigator: {} })).toBe(true)
  })

  test("navigator.standalone (iOS home screen)", () => {
    expect(isStandaloneDisplay({ matchMedia: none, navigator: { standalone: true } })).toBe(true)
  })

  test("a Trusted Web Activity has an android-app referrer", () => {
    expect(isStandaloneDisplay({ matchMedia: none, navigator: {}, referrer: "android-app://uz.ihsu.app" })).toBe(true)
  })
})
