/** The branches of the install page: standalone, iOS, Android with and without the prompt, desktop. */
import { describe, expect, test } from "bun:test"
import { pickInstallView, type InstallContext } from "../utils/install-view"

const browserTab: InstallContext = {
  pwaMode: true,
  standalone: false,
  miniApp: false,
  continueInBrowser: false,
  platform: "desktop",
  hasPrompt: false,
  installed: false,
  inAppBrowser: false,
}

describe("pickInstallView", () => {
  test("the portal never shows an install page", () => {
    expect(pickInstallView({ ...browserTab, pwaMode: false })).toBe("app")
  })

  test("the installed app (standalone) shows the app", () => {
    for (const platform of ["ios", "android", "desktop"] as const) {
      expect(pickInstallView({ ...browserTab, platform, standalone: true })).toBe("app")
    }
  })

  test("the Telegram mini app shows the app", () => {
    expect(pickInstallView({ ...browserTab, platform: "android", miniApp: true })).toBe("app")
  })

  test("iPhone in Safari gets the Share → Add to Home Screen steps", () => {
    expect(pickInstallView({ ...browserTab, platform: "ios" })).toBe("ios")
  })

  test("Android gets the install button when the browser offered the prompt", () => {
    expect(pickInstallView({ ...browserTab, platform: "android", hasPrompt: true })).toBe("android-prompt")
  })

  test("Android without a prompt gets the menu instructions", () => {
    expect(pickInstallView({ ...browserTab, platform: "android", hasPrompt: false })).toBe("android-manual")
  })

  test("a computer gets the QR code, even if Chrome offers an install prompt", () => {
    expect(pickInstallView({ ...browserTab, platform: "desktop" })).toBe("desktop")
    expect(pickInstallView({ ...browserTab, platform: "desktop", hasPrompt: true })).toBe("desktop")
  })

  test("Continue in browser shows the app again", () => {
    expect(pickInstallView({ ...browserTab, platform: "ios", continueInBrowser: true })).toBe("app")
  })

  test("right after installing, the page says so (even if the choice to continue was stored)", () => {
    expect(pickInstallView({ ...browserTab, platform: "android", installed: true })).toBe("installed")
    expect(pickInstallView({ ...browserTab, platform: "android", installed: true, continueInBrowser: true })).toBe(
      "installed",
    )
  })
})
