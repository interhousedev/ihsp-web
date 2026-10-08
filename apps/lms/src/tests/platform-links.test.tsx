/** WEB-2, GEN-9: the profile menu of the LMS app lists the IHSP platforms of the user's role. */
import { describe, expect, test } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { teacherMe } from "@ihsp/test-utils"
import { LmsShell } from "../features/shell/components/lms-shell"
import { screen, within } from "@testing-library/react"
import { renderLms } from "./helpers"

function openAs(client: "lms"): void {
  window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: client }
  resetConfig()
}

describe("profile menu", () => {
  test("an LMS administrator sees LMS (marked as current) and ID only", async () => {
    openAs("lms")
    const { user } = renderLms(
      <LmsShell>
        <p>page body</p>
      </LmsShell>,
      { session: { user: { ...teacherMe, roles: ["lms_admin"] } } },
    )

    await user.click(await screen.findByRole("button", { name: "Account menu" }))

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByRole("menuitem", { name: /LMS/ })).toHaveAttribute("aria-current", "page")
    expect(within(menu).getByRole("menuitem", { name: /ID/ })).toHaveAttribute("href", "http://localhost:3001")
    expect(within(menu).queryByRole("menuitem", { name: /SP|Staff|Admin/ })).not.toBeInTheDocument()
  })

  test("a teacher also sees Staff", async () => {
    openAs("lms")
    const { user } = renderLms(
      <LmsShell>
        <p>page body</p>
      </LmsShell>,
      { session: { user: { ...teacherMe, roles: ["teacher"] } } },
    )

    await user.click(await screen.findByRole("button", { name: "Account menu" }))

    const menu = await screen.findByRole("menu")
    expect(within(menu).getByRole("menuitem", { name: /Staff/ })).toHaveAttribute("href", "http://localhost:3003")
  })
})
