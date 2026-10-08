/** WEB-2, GEN-9: the profile menu of the Staff app lists the IHSP platforms of the user's role. */
import { describe, expect, test } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { StaffShell } from "../features/shell/components/staff-shell"
import { screen, within } from "@testing-library/react"
import { configureTests, renderStaff } from "./helpers"

configureTests()

function openAs(client: "staff"): void {
  window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: client }
  resetConfig()
}

describe("profile menu", () => {
  test("a teacher sees Staff (marked as current), LMS and ID", async () => {
    openAs("staff")
    const { user } = renderStaff(
      <StaffShell>
        <p>page body</p>
      </StaffShell>,
    )

    await user.click(await screen.findByRole("button", { name: "Account menu" }))

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByRole("menuitem", { name: /Staff/ })).toHaveAttribute("aria-current", "page")
    expect(within(menu).getByRole("menuitem", { name: /LMS/ })).toHaveAttribute("href", "http://localhost:3005")
    expect(within(menu).getByRole("menuitem", { name: /ID/ })).toHaveAttribute("href", "http://localhost:3001")
    expect(within(menu).queryByRole("menuitem", { name: /SP|Admin/ })).not.toBeInTheDocument()
  })
})
