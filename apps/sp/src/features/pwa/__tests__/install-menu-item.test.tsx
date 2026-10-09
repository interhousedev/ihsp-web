/** The portal's profile menu offers the installable app; the app itself and Telegram do not. */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import { screen, within } from "@testing-library/react"
import { configureTests } from "../../../tests/helpers"
import { ProfileMenu } from "../../shell/components/profile-menu"
import { renderPwa, setRuntimeConfig } from "./pwa-test-support"

configureTests()

beforeEach(() => setRuntimeConfig("sp", { APP_URL: "https://app.ihsu.uz" }))
afterEach(() => {
  delete (window as unknown as Record<string, unknown>).Telegram
})

async function openMenu() {
  const { user } = renderPwa(<ProfileMenu />)
  await user.click(screen.getByRole("button", { name: "Account menu" }))
  return user
}

describe("Install the app in the profile menu", () => {
  test("opens the app host in a new tab", async () => {
    const open = spyOn(window, "open").mockImplementation(() => null)
    const user = await openMenu()

    await user.click(await screen.findByRole("menuitem", { name: "Install the app" }))

    expect(open).toHaveBeenCalledWith("https://app.ihsu.uz", "_blank", "noopener,noreferrer")
  })

  test("is absent without an app host", async () => {
    setRuntimeConfig("sp", { APP_URL: "" })

    await openMenu()

    expect(await screen.findByRole("menuitem", { name: "Settings" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Install the app" })).not.toBeInTheDocument()
  })

  test("is absent in the installable app itself", async () => {
    setRuntimeConfig("pwa", { APP_URL: "https://app.ihsu.uz" })

    await openMenu()

    expect(await screen.findByRole("menuitem", { name: "Settings" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Install the app" })).not.toBeInTheDocument()
  })
})

describe("platform links in the installed app", () => {
  test("the app is the student portal on another host: SP is marked as current", async () => {
    setRuntimeConfig("pwa", { APP_URL: "https://app.ihsu.uz" })

    await openMenu()

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByRole("menuitem", { name: /SP/ })).toHaveAttribute("aria-current", "page")
  })
})
