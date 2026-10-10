/** WEB-2, GEN-9: the profile menu of the ID app lists the IHSP platforms of the user's role. */
import { describe, expect, test } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { AccountShell } from "../features/account/components/account-shell"
import { screen, within } from "@testing-library/react"
import { LOGGED_IN, allowSlowTests, renderId } from "./helpers"

allowSlowTests()

function openAs(client: "id"): void {
  window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: client }
  resetConfig()
}

describe("account menu", () => {
  test("a student sees SP, LMS and ID (marked as current)", async () => {
    openAs("id")
    const { user } = renderId(
      <AccountShell>
        <p>page body</p>
      </AccountShell>,
      { session: LOGGED_IN },
    )

    await user.click(await screen.findByRole("button", { name: "Account menu" }))

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByRole("menuitem", { name: /ID/ })).toHaveAttribute("aria-current", "page")
    expect(within(menu).getByRole("menuitem", { name: /SP/ })).toHaveAttribute("href", "http://localhost:3002")
    expect(within(menu).getByRole("menuitem", { name: /LMS/ })).toHaveAttribute("href", "http://localhost:3005")
  })
})
