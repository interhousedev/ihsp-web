/** A5: the lesson player's top bar ends with the shared cluster: the AI entry and the avatar whose menu holds the app switcher. */
import { describe, expect, test } from "bun:test"
import { screen, within } from "@testing-library/react"
import { LearnerTopBar } from "../features/player/components/learner-topbar"
import { renderLms } from "./helpers"

describe("header cluster", () => {
  test("shows the AI entry and an avatar menu with the app switcher", async () => {
    const { user } = renderLms(<LearnerTopBar strip={<div>strip</div>} onOpenContents={() => undefined} />)

    expect(await screen.findByRole("link", { name: "AI assistant" })).toBeInTheDocument()
    await user.click(await screen.findByRole("button", { name: "Account menu" }))

    const grid = await screen.findByTestId("app-switcher")
    expect(within(grid).getAllByRole("menuitem").length).toBeGreaterThan(1)
    expect(grid.querySelectorAll("img").length).toBeGreaterThan(1)
  })
})
