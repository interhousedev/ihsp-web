/** WEB-2, GEN-9: the profile menu of the Admin app lists the IHSP platforms of the user's role. */
import { describe, expect, test } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { adminMe } from "@ihsp/test-utils"
import { AdminFrame } from "../features/shell/components/admin-frame"
import { screen, within } from "@testing-library/react"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

function openAs(client: "admin"): void {
  window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: client }
  resetConfig()
}

async function openMenu(user: Awaited<ReturnType<typeof renderAdmin>>["user"]): Promise<HTMLElement> {
  await user.click(await screen.findByRole("button", { name: "Account menu" }))
  return screen.findByRole("menu")
}

describe("profile menu", () => {
  test("an administrator sees Admin (marked as current), LMS and ID, and no Staff", async () => {
    openAs("admin")
    const { user } = renderAdmin(
      <AdminFrame>
        <p>page body</p>
      </AdminFrame>,
      { session: { user: { ...adminMe, roles: ["admin"] } } },
    )

    const menu = await openMenu(user)

    expect(within(menu).getByRole("menuitem", { name: /Admin/ })).toHaveAttribute("aria-current", "page")
    expect(within(menu).getByRole("menuitem", { name: /LMS/ })).toHaveAttribute("href", "http://localhost:3005")
    expect(within(menu).getByRole("menuitem", { name: /ID/ })).toHaveAttribute("href", "http://localhost:3001")
    expect(within(menu).queryByRole("menuitem", { name: /Staff/ })).not.toBeInTheDocument()
  })

  test("an administrator who also teaches gets the link to Staff as well", async () => {
    openAs("admin")
    const { user } = renderAdmin(
      <AdminFrame>
        <p>page body</p>
      </AdminFrame>,
      { session: { user: { ...adminMe, roles: ["admin", "teacher"] } } },
    )

    const menu = await openMenu(user)

    expect(within(menu).getByRole("menuitem", { name: /Staff/ })).toHaveAttribute("href", "http://localhost:3003")
  })
})
