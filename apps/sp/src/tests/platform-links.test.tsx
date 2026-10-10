/** WEB-2, GEN-9: the profile menu of the SP app lists the IHSP platforms of the user's role. */
import { describe, expect, test } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { SpShell } from "../features/shell/components/sp-shell"
import { screen, within } from "@testing-library/react"
import { configureTests, renderSp } from "./helpers"

configureTests()

function openAs(client: "sp"): void {
  window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: client }
  resetConfig()
}

describe("profile menu", () => {
  test("a student sees SP (marked as current), LMS and ID, opened in the same tab", async () => {
    openAs("sp")
    const { user } = renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )

    await user.click(await screen.findByRole("button", { name: "Account menu" }))

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByRole("menuitem", { name: /SP/ })).toHaveAttribute("aria-current", "page")
    expect(within(menu).getByRole("menuitem", { name: /LMS/ })).toHaveAttribute("href", "http://localhost:3005")
    expect(within(menu).getByRole("menuitem", { name: /ID/ })).toHaveAttribute("href", "http://localhost:3001")
    expect(within(menu).getByRole("menuitem", { name: /ID/ })).not.toHaveAttribute("target")
    expect(within(menu).queryByRole("menuitem", { name: /Staff|Admin/ })).not.toBeInTheDocument()
  })
})
