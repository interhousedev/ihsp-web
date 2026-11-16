/** `<html lang>` follows the stored locale before first paint (static HTML, offline fallback, screen readers). */
import { afterEach, describe, expect, test } from "bun:test"
import { LANG_INIT_SCRIPT } from "../app/lang-init"

function runScript(languages: string[]): string {
  Object.defineProperty(navigator, "languages", { configurable: true, value: languages })
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- the inline script is a plain string
  new Function(LANG_INIT_SCRIPT)()
  return document.documentElement.lang
}

afterEach(() => {
  localStorage.removeItem("ihsp.locale")
  document.documentElement.lang = ""
})

describe("lang init script", () => {
  test("uses the stored locale first", () => {
    localStorage.setItem("ihsp.locale", "ru")
    expect(runScript(["en-US"])).toBe("ru")
  })

  test("falls back to the first supported browser language", () => {
    expect(runScript(["de-DE", "en-GB"])).toBe("en")
  })

  test("defaults to Uzbek", () => {
    localStorage.setItem("ihsp.locale", "xx")
    expect(runScript(["de-DE"])).toBe("uz")
  })
})
