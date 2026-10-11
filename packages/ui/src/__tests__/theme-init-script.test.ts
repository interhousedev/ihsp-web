import { afterEach, describe, expect, it } from "bun:test"
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from "@ihsp/i18n"
import { THEME_INIT_SCRIPT } from "../components/themes/theme-init-script"

const html = document.documentElement

function runInitScript(): void {
  new Function(THEME_INIT_SCRIPT)()
}

afterEach(() => {
  html.className = ""
  html.removeAttribute("data-theme")
  html.style.colorScheme = ""
  html.removeAttribute("lang")
  window.localStorage.clear()
})

describe("THEME_INIT_SCRIPT", () => {
  it("paints light when nothing is cached", () => {
    runInitScript()

    expect(html.classList.contains("dark")).toBe(false)
    expect(html.classList.contains("light")).toBe(true)
    expect(html.style.colorScheme).toBe("light")
  })

  it("paints the theme cached from the account", () => {
    window.localStorage.setItem("theme", "dark")

    runInitScript()

    expect(html.classList.contains("dark")).toBe(true)
    expect(html.style.colorScheme).toBe("dark")
  })

  it("follows the device when the account says system", () => {
    window.localStorage.setItem("theme", "system")
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({ matches: query.includes("dark"), media: query })) as typeof original

    runInitScript()
    window.matchMedia = original

    expect(html.classList.contains("dark")).toBe(true)
  })

  it("sets the document language from the stored locale, DEFAULT_LOCALE otherwise", () => {
    expect(THEME_INIT_SCRIPT).toContain(`'${LOCALE_STORAGE_KEY}'`)

    runInitScript()
    expect(html.lang).toBe(DEFAULT_LOCALE)

    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en")
    runInitScript()
    expect(html.lang).toBe("en")

    window.localStorage.setItem(LOCALE_STORAGE_KEY, "xx")
    runInitScript()
    expect(html.lang).toBe(DEFAULT_LOCALE)
  })

  it("keeps painting the saved color palette", () => {
    window.localStorage.setItem("ihsp.color-theme", "claude")

    runInitScript()

    expect(html.getAttribute("data-theme")).toBe("claude")
  })
})
