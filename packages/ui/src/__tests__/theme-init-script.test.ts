import { afterEach, describe, expect, it } from "bun:test"
import { THEME_INIT_SCRIPT } from "../components/themes/theme-init-script"

const html = document.documentElement

function runInitScript(): void {
  new Function(THEME_INIT_SCRIPT)()
}

afterEach(() => {
  html.className = ""
  html.removeAttribute("data-theme")
  html.style.colorScheme = ""
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

  it("keeps painting the saved color palette", () => {
    window.localStorage.setItem("ihsp.color-theme", "claude")

    runInitScript()

    expect(html.getAttribute("data-theme")).toBe("claude")
  })
})
