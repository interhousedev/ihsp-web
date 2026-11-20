/** A5: the header of this app ends with the shared cluster: the AI entry and the avatar whose menu holds the app switcher. */
import { describe, expect, test } from "bun:test"
import { screen, within } from "@testing-library/react"
import { SpShell } from "../features/shell/components/sp-shell"
import { configureTests, renderSp } from "./helpers"

configureTests()

describe("header cluster", () => {
  test("shows the AI entry and an avatar menu with the app switcher", async () => {
    const { user } = renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )

    await screen.findByText("page body")
    expect(await screen.findByRole("button", { name: "Quick AI helper" })).toBeInTheDocument()
    await user.click(screen.getAllByRole("button", { name: "Account menu" })[0] as HTMLElement)

    const grid = await screen.findByTestId("app-switcher")
    expect(within(grid).getAllByRole("menuitem").length).toBeGreaterThan(1)
    expect(grid.querySelectorAll("img").length).toBeGreaterThan(1)
  })
})
