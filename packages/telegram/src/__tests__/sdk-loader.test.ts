import { afterEach, beforeAll, describe, expect, it } from "bun:test"
import { TELEGRAM_SDK_LOADER, TELEGRAM_SDK_URL } from "../sdk-loader"

type HappySettings = { disableJavaScriptFileLoading: boolean; handleDisabledFileLoadingAsSuccess: boolean }

beforeAll(() => {
  // The script is only inserted, never fetched.
  const settings = (window as unknown as { happyDOM: { settings: HappySettings } }).happyDOM.settings
  settings.disableJavaScriptFileLoading = true
  settings.handleDisabledFileLoadingAsSuccess = true
})

function run(): HTMLScriptElement[] {
  new Function(TELEGRAM_SDK_LOADER)()
  return [...document.head.querySelectorAll<HTMLScriptElement>("script[data-telegram-sdk]")]
}

afterEach(() => {
  document.head.querySelectorAll("script[data-telegram-sdk]").forEach((node) => node.remove())
  window.sessionStorage.clear()
  window.location.hash = ""
  delete (window as unknown as { TelegramWebviewProxy?: unknown }).TelegramWebviewProxy
})

describe("TELEGRAM_SDK_LOADER", () => {
  it("loads nothing for an ordinary browser, so no page waits for telegram.org", () => {
    expect(run()).toHaveLength(0)
  })

  it("loads the SDK without blocking when Telegram launched the page (hash)", () => {
    window.location.hash = "#tgWebAppData=query_id%3DAA&tgWebAppVersion=8.0&tgWebAppPlatform=ios"

    const [script] = run()

    expect(script?.src).toBe(TELEGRAM_SDK_URL)
    expect(script?.async).toBe(true)
  })

  it("loads the SDK on later pages of a mini app (launch parameters kept in sessionStorage)", () => {
    window.sessionStorage.setItem("tapps/launchParams", "tgWebAppData=x")

    expect(run()).toHaveLength(1)
  })

  it("loads the SDK inside the native WebView", () => {
    ;(window as unknown as { TelegramWebviewProxy: unknown }).TelegramWebviewProxy = {}

    expect(run()).toHaveLength(1)
  })

  it("never throws, even when storage is blocked", () => {
    const original = Object.getOwnPropertyDescriptor(window, "sessionStorage")
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("blocked")
      },
    })
    try {
      expect(run()).toHaveLength(0)
    } finally {
      if (original) Object.defineProperty(window, "sessionStorage", original)
    }
  })
})
