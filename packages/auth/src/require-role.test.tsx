/** SP-UX-a6: without a `fallback` RequireRole behaves as before; with one the fallback replaces the "No access" screen. */
import { describe, expect, it } from "bun:test"
import { I18nTestProvider } from "@ihsp/i18n"
import enMessages from "@ihsp/i18n/messages/en.json"
import { setSession } from "./store"
import { render, screen } from "@testing-library/react"
import { RequireRole } from "./require-role"
import { userMe } from "@ihsp/test-utils"

function setup(roles: (typeof userMe)["roles"], fallback?: React.ReactNode) {
  setSession({ access_token: "t", expires_at: Date.now() + 60_000, user: { ...userMe, roles } })
  return render(
    <I18nTestProvider messages={enMessages}>
      <RequireRole role="student" fallback={fallback}>
        <p>secret</p>
      </RequireRole>
    </I18nTestProvider>,
  )
}

describe("RequireRole", () => {
  it("SP-UX-a6: shows the children to a user with the role", () => {
    setup(["student"])
    expect(screen.getByText("secret")).toBeInTheDocument()
  })

  it("SP-UX-a6: without a fallback a user without the role sees No access", () => {
    setup(["teacher"])
    expect(screen.getByText("No access")).toBeInTheDocument()
    expect(screen.queryByText("secret")).not.toBeInTheDocument()
  })

  it("SP-UX-a6: a fallback replaces No access", () => {
    setup(["teacher"], <p>elsewhere</p>)
    expect(screen.getByText("elsewhere")).toBeInTheDocument()
    expect(screen.queryByText("No access")).not.toBeInTheDocument()
  })
})
