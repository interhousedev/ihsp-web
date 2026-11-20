/** A5: the header of this app ends with the shared cluster: the AI entry and the avatar whose menu holds the app switcher. */
import { describe, expect, test } from "bun:test"
import { screen, within } from "@testing-library/react"
import { StaffShell } from "../features/shell/components/staff-shell"
import { configureTests, renderStaff } from "./helpers"

configureTests()

describe("header cluster", () => {
  test("shows the AI entry and an avatar menu with the app switcher", async () => {
    const { user } = renderStaff(
      <StaffShell>
        <p>page body</p>
      </StaffShell>,
    )

    await screen.findByText("page body")
    expect(await screen.findByRole("link", { name: "AI assistant" })).toBeInTheDocument()
    await user.click(screen.getAllByRole("button", { name: "Account menu" })[0] as HTMLElement)

    const grid = await screen.findByTestId("app-switcher")
    expect(within(grid).getAllByRole("menuitem").length).toBeGreaterThan(1)
    expect(grid.querySelectorAll("img").length).toBeGreaterThan(1)
  })
})
