/** The hub's install page of one app (`/install/?app=library`): the steps for this device and a link that opens the app to install. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { setTestRoute } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { AppInstallPage, readInstallAppKey } from "../components/app-install-page"
import { ANDROID_UA, DESKTOP_UA, IPHONE_UA, fakeBrowser, renderPwa, setRuntimeConfig } from "./pwa-test-support"

let restore: (() => void) | null = null

function openPage(app: string, userAgent: string): void {
  restore = fakeBrowser({ userAgent })
  renderPwa(<AppInstallPage />, { route: `/install/?app=${app}` })
}

beforeEach(() => setRuntimeConfig("pwa", { APP_URL: "http://localhost:3007" }))

afterEach(() => {
  restore?.()
  restore = null
  setTestRoute("/")
})

describe("AppInstallPage", () => {
  test("reads the app from the address", () => {
    expect(readInstallAppKey("?app=library")).toBe("library")
    expect(readInstallAppKey("")).toBeNull()
  })

  test("names the app and opens its own address with ?install=1", () => {
    openPage("library", ANDROID_UA)

    expect(screen.getByRole("heading", { level: 1, name: "Install library.iht" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open library.iht and install" })).toHaveAttribute(
      "href",
      "http://localhost:3008/?install=1",
    )
    expect(screen.getByText("Tap Install in the message that appears")).toBeInTheDocument()
  })

  test("gives the iPhone the Add to Home Screen steps", () => {
    openPage("lms", IPHONE_UA)

    expect(screen.getByText("Scroll down and tap Add to Home Screen")).toBeInTheDocument()
    expect(screen.getByText("Tap Add. lms.iht appears on your home screen.")).toBeInTheDocument()
  })

  test("gives a computer the address bar steps", () => {
    openPage("staff", DESKTOP_UA)

    expect(
      screen.getByText("Click Install in the message that appears, or the install icon in the address bar"),
    ).toBeInTheDocument()
  })

  test("says so for an app that is unknown or not configured", () => {
    setRuntimeConfig("pwa", { APP_URL: "http://localhost:3007", LIBRARY_URL: "" })
    openPage("library", ANDROID_UA)

    expect(screen.getByRole("alert")).toHaveTextContent("This app cannot be installed from here.")
    expect(screen.getByRole("link", { name: "All IHT apps" })).toHaveAttribute("href", "/")
  })
})
