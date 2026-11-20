/** A5: the header of this app ends with the shared cluster: the AI entry and the avatar whose menu holds the app switcher. */
import { describe, expect, test } from "bun:test"
import { screen, within } from "@testing-library/react"
import { LibraryShell } from "../features/shell/components/library-shell"
import { renderLibraryApp } from "./helpers"

describe("header cluster", () => {
  test("shows the AI entry and an avatar menu with the app switcher", async () => {
    const { user } = renderLibraryApp(
      <LibraryShell access="auth">
        <p>page body</p>
      </LibraryShell>,
    )

    await screen.findByText("page body")
    expect(await screen.findByRole("link", { name: "AI assistant" })).toBeInTheDocument()
    await user.click(screen.getAllByRole("button", { name: "Account menu" })[0] as HTMLElement)

    const grid = await screen.findByTestId("app-switcher")
    expect(within(grid).getAllByRole("menuitem").length).toBeGreaterThan(1)
    expect(grid.querySelectorAll("img").length).toBeGreaterThan(1)
  })
})
