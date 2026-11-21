/** The inline head script: it only does something in pwa mode. */
import { afterEach, describe, expect, test } from "bun:test"
import { INSTALL_PROMPT_EVENT, INSTALL_PROMPT_GLOBAL, PWA_HEAD_SCRIPT } from "../utils/pwa-head"

function run(): void {
  new Function(PWA_HEAD_SCRIPT)()
}

function headSnapshot(): string[] {
  return [...document.head.querySelectorAll("link, meta")].map((node) => node.outerHTML)
}

afterEach(() => {
  for (const node of document.head.querySelectorAll("link[rel], meta[name]")) node.remove()
  delete (window as unknown as Record<string, unknown>)[INSTALL_PROMPT_GLOBAL]
})

describe("PWA_HEAD_SCRIPT", () => {
  test("does nothing in the portal", () => {
    const before = headSnapshot()
    window.__ENV__ = { APP_MODE: "sp" }

    run()

    expect(headSnapshot()).toEqual(before)
  })

  test("does nothing without a runtime config", () => {
    window.__ENV__ = undefined

    expect(() => run()).not.toThrow()
  })

  test("in pwa mode it adds the manifest, the iOS tags and the theme colours", () => {
    window.__ENV__ = { APP_MODE: "pwa" }

    run()

    expect(document.head.querySelector('link[rel="manifest"]')?.getAttribute("href")).toBe("/manifest.webmanifest")
    expect(document.head.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href")).toBe(
      "/icons/apple-touch-icon.png",
    )
    expect(document.head.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute("content")).toBe(
      "yes",
    )
    expect(document.head.querySelectorAll('meta[name="theme-color"]').length).toBe(2)
  })

  test("in pwa mode it keeps the install prompt that Chrome fires before React is ready", () => {
    window.__ENV__ = { APP_MODE: "pwa" }
    run()
    const heard: string[] = []
    window.addEventListener(INSTALL_PROMPT_EVENT, () => heard.push("caught"))
    const prompt = new Event("beforeinstallprompt", { cancelable: true })

    window.dispatchEvent(prompt)

    expect(prompt.defaultPrevented).toBe(true)
    expect((window as unknown as Record<string, unknown>)[INSTALL_PROMPT_GLOBAL]).toBe(prompt)
    // happy-dom keeps the listeners of every earlier run of the script on the shared window, so there may be several.
    expect(heard).toContain("caught")
  })
})
