/** The install page: standalone, iOS, Android with the install prompt, Android without, desktop, and the portal. */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { act, screen } from "@testing-library/react"
import { configureTests } from "../../../tests/helpers"
import { PwaGate } from "../components/pwa-gate"
import { INSTALL_PROMPT_GLOBAL } from "../utils/pwa-head"
import { ANDROID_UA, DESKTOP_UA, IPHONE_UA, fakeBrowser, renderPwa, setRuntimeConfig } from "./pwa-test-support"

configureTests()

let restore: () => void = () => undefined

beforeEach(() => {
  setRuntimeConfig("pwa", { APP_URL: "https://app.ihsu.uz", BOT_USERNAME: "ihspbot" })
})

afterEach(() => {
  restore()
  restore = () => undefined
  delete (window as unknown as Record<string, unknown>)[INSTALL_PROMPT_GLOBAL]
})

const APP = "the app itself"

function renderGate() {
  return renderPwa(
    <PwaGate>
      <p>{APP}</p>
    </PwaGate>,
  )
}

/** Chrome's install prompt event with a controllable answer. */
function installPromptEvent(outcome: "accepted" | "dismissed") {
  const prompt = mock(async () => undefined)
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  })
  return { event, prompt }
}

describe("install page (pwa mode, browser tab)", () => {
  test("the portal (sp mode) shows the app and no install page", () => {
    setRuntimeConfig("sp")
    restore = fakeBrowser({ userAgent: IPHONE_UA })

    renderGate()

    expect(screen.getByText(APP)).toBeInTheDocument()
    expect(screen.queryByText("Add IHSP to your home screen")).not.toBeInTheDocument()
  })

  test("the installed app (standalone) shows the app", () => {
    restore = fakeBrowser({ userAgent: ANDROID_UA, standalone: true })

    renderGate()

    expect(screen.getByText(APP)).toBeInTheDocument()
    expect(screen.queryByText("Add IHSP to your home screen")).not.toBeInTheDocument()
  })

  test("an iPhone home screen app (navigator.standalone) shows the app", () => {
    restore = fakeBrowser({ userAgent: IPHONE_UA, iosStandalone: true })

    renderGate()

    expect(screen.getByText(APP)).toBeInTheDocument()
  })

  test("iPhone: Share → Add to Home Screen, step by step", () => {
    restore = fakeBrowser({ userAgent: IPHONE_UA })

    renderGate()

    expect(screen.getByRole("heading", { level: 1, name: "Add IHSP to your home screen" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Install on iPhone or iPad" })).toBeInTheDocument()
    expect(screen.getByText("Tap the Share button in the browser bar")).toBeInTheDocument()
    expect(screen.getByText("Scroll down and tap Add to Home Screen")).toBeInTheDocument()
    expect(screen.getByText("Tap Add. IHSP appears on your home screen.")).toBeInTheDocument()
    expect(screen.queryByText(APP)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Install the app" })).not.toBeInTheDocument()
  })

  test("iPhone inside another app (Telegram): open Safari first", () => {
    restore = fakeBrowser({ userAgent: `${IPHONE_UA} Telegram` })

    renderGate()

    expect(screen.getByRole("note")).toHaveTextContent("Open this page in Safari")
  })

  test("Android with the install prompt: a real Install button opens the browser dialog", async () => {
    restore = fakeBrowser({ userAgent: ANDROID_UA })
    const { event, prompt } = installPromptEvent("accepted")
    const { user } = renderGate()
    expect(screen.queryByRole("button", { name: "Install the app" })).not.toBeInTheDocument()

    act(() => {
      window.dispatchEvent(event)
    })
    await user.click(await screen.findByRole("button", { name: "Install the app" }))

    expect(prompt).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  test("Android: a prompt caught before the page was ready is used at once", async () => {
    restore = fakeBrowser({ userAgent: ANDROID_UA })
    const { event } = installPromptEvent("accepted")
    ;(window as unknown as Record<string, unknown>)[INSTALL_PROMPT_GLOBAL] = event

    renderGate()

    expect(await screen.findByRole("button", { name: "Install the app" })).toBeInTheDocument()
  })

  test("Android: after the app was installed the page says so", async () => {
    restore = fakeBrowser({ userAgent: ANDROID_UA })
    renderGate()

    act(() => {
      window.dispatchEvent(new Event("appinstalled"))
    })

    expect(await screen.findByText("IHSP is installed")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Install the app" })).not.toBeInTheDocument()
  })

  test("Android without a prompt (Firefox, Samsung): menu instructions", () => {
    restore = fakeBrowser({ userAgent: ANDROID_UA })

    renderGate()

    expect(screen.getByRole("heading", { name: "Install from the browser menu" })).toBeInTheDocument()
    expect(screen.getByText("Choose Install app or Add to Home screen")).toBeInTheDocument()
  })

  test("desktop: a QR code with the app address, and no install button", () => {
    restore = fakeBrowser({ userAgent: DESKTOP_UA })

    renderGate()

    expect(screen.getByRole("heading", { name: "Open IHSP on your phone" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "QR code with the address of the IHSP app" })).toBeInTheDocument()
    expect(screen.getByText("Or open https://app.ihsu.uz/ on your phone.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Install the app" })).not.toBeInTheDocument()
  })

  test("every install page says that notifications about new marks need the app", () => {
    restore = fakeBrowser({ userAgent: DESKTOP_UA })

    renderGate()

    expect(screen.getByText("Install to get notifications about new marks")).toBeInTheDocument()
  })

  test("on iPhone, notifications are explained as an install-only feature", () => {
    restore = fakeBrowser({ userAgent: IPHONE_UA })

    renderGate()

    expect(screen.getByText("On iPhone, notifications only work once the app is installed.")).toBeInTheDocument()
  })

  test("Open in Telegram points at the bot, on every device", () => {
    restore = fakeBrowser({ userAgent: DESKTOP_UA })

    renderGate()

    const link = screen.getByRole("link", { name: "Open in Telegram" })
    expect(link).toHaveAttribute("href", "https://t.me/ihspbot")
  })

  test("Continue in browser opens the app and remembers the choice", async () => {
    restore = fakeBrowser({ userAgent: DESKTOP_UA })
    const first = renderGate()

    await first.user.click(screen.getByRole("button", { name: "Continue in browser" }))

    expect(await screen.findByText(APP)).toBeInTheDocument()
    expect(window.localStorage.getItem("ihsp.pwa.continue-in-browser")).not.toBeNull()
    first.unmount()

    renderGate()

    expect(screen.getByText(APP)).toBeInTheDocument()
  })

  test("a visitor who is not signed in can still pick the language", () => {
    restore = fakeBrowser({ userAgent: IPHONE_UA })

    renderGate()

    expect(screen.getByRole("combobox", { name: "Language" })).toBeInTheDocument()
  })
})
