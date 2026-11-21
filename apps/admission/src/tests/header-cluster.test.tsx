/** A5: the header of this app ends with the shared cluster: the AI entry and the avatar whose menu holds the app switcher. */
import { describe, expect, test } from "bun:test"
import { screen, within } from "@testing-library/react"
import { resetConfig } from "@ihsp/config"
import { AdmissionShell } from "../features/shell/components/admission-shell"
import { renderAdmissionApp } from "./helpers"

describe("header cluster", () => {
  test("shows the AI entry and an avatar menu with the app switcher", async () => {
    window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: "admission" }
    resetConfig()
    const { user } = renderAdmissionApp(
      <AdmissionShell>
        <p>page body</p>
      </AdmissionShell>,
    )

    await screen.findByText("page body")
    expect(await screen.findByRole("button", { name: "AI assistant" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /platforms/i }))

    const grid = await screen.findByTestId("app-switcher")
    expect(within(grid).getAllByRole("menuitem").length).toBeGreaterThan(1)
    expect(grid.querySelectorAll("svg").length).toBeGreaterThan(1)
  })
})
