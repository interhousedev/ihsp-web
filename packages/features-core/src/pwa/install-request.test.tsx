/** Installing through the apps hub: the hub's per-app address, and `?install=1` making the app offer its own install. */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { TEST_ENV, renderWithProviders, setTestRoute } from "@ihsp/test-utils"
import { act, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Toaster } from "sonner"
import { InstallRequest } from "./components/install-request"
import { useInstallAppMenuItem } from "./hooks/use-install-app-menu-item"
import { hasInstallRequest, hubInstallUrl, installRequestUrl } from "./utils/hub-install"

const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"

function setEnv(extra: Record<string, unknown> = {}): void {
  window.__ENV__ = { ...TEST_ENV, APP_MODE: "pwa", OAUTH_CLIENT_ID: "library", ...extra }
  resetConfig()
}

function fakeUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, "userAgent", { value: userAgent, configurable: true })
}

function InstallEntry() {
  const item = useInstallAppMenuItem()
  return item ? (
    <button type="button" onClick={() => item.onSelect?.()}>
      {item.title}
    </button>
  ) : null
}

const originalUserAgent = window.navigator.userAgent

beforeEach(() => setEnv())

afterEach(() => {
  fakeUserAgent(originalUserAgent)
  setTestRoute("/")
})

describe("hub addresses", () => {
  test("the hub's install page of an app", () => {
    expect(hubInstallUrl("https://app.ihsu.uz/", "library")).toBe("https://app.ihsu.uz/install/?app=library")
    expect(hubInstallUrl("http://app.localhost", "lms")).toBe("http://app.localhost/install/?app=lms")
  })

  test("the app's own address that asks it to offer the install", () => {
    expect(installRequestUrl("https://lib.ihsu.uz/")).toBe("https://lib.ihsu.uz/?install=1")
  })
})

describe("the Install entry of the profile menu", () => {
  test("opens the hub's install page of this app", async () => {
    setEnv({ APP_URL: "https://app.ihsu.uz" })
    const open = mock(() => null)
    const previous = window.open
    window.open = open as unknown as typeof window.open
    try {
      renderWithProviders(<InstallEntry />)
      await userEvent.click(screen.getByRole("button", { name: "Install the app" }))

      expect(open).toHaveBeenCalledWith("https://app.ihsu.uz/install/?app=library", "_blank", "noopener,noreferrer")
    } finally {
      window.open = previous
    }
  })
})

describe("?install=1", () => {
  test("offers Chrome's install dialog from a toast and clears the flag", async () => {
    fakeUserAgent(ANDROID_UA)
    const prompt = mock(async () => undefined)

    renderWithProviders(
      <>
        <Toaster />
        <InstallRequest promptWaitMs={10} />
      </>,
      { route: "/?install=1" },
    )
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    })
    act(() => {
      window.dispatchEvent(event)
    })

    await userEvent.click(await screen.findByRole("button", { name: "Install" }))
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(hasInstallRequest()).toBe(false)
  })

  test("shows the iPhone steps when the browser has no install dialog", async () => {
    fakeUserAgent(IPHONE_UA)

    renderWithProviders(
      <>
        <Toaster />
        <InstallRequest promptWaitMs={10} />
      </>,
      { route: "/?install=1" },
    )

    await waitFor(() =>
      expect(screen.getByText("Tap the Share button in Safari, then Add to Home Screen.")).toBeInTheDocument(),
    )
  })

  test("asks nothing without the flag", async () => {
    fakeUserAgent(IPHONE_UA)

    renderWithProviders(
      <>
        <Toaster />
        <InstallRequest promptWaitMs={10} />
      </>,
      { route: "/" },
    )
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(screen.queryByText("Tap the Share button in Safari, then Add to Home Screen.")).not.toBeInTheDocument()
  })
})
