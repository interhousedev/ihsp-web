import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HelpWidget } from "./help-widget"

describe("HelpWidget", () => {
  it("opens and closes the card", async () => {
    const { user } = renderWithProviders(<HelpWidget />, { route: "/" })

    await user.click(screen.getByRole("button", { name: "Help: find a feature" }))
    expect(screen.getByRole("dialog", { name: "Find a feature" })).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Close help" })[0]!)
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("is not shown on the assistant page", () => {
    renderWithProviders(<HelpWidget />, { route: "/assistant/" })
    expect(screen.queryByRole("button", { name: "Help: find a feature" })).not.toBeInTheDocument()
  })

  it("filters the map of pages by the typed words", async () => {
    const { user } = renderWithProviders(<HelpWidget />, { route: "/" })
    await user.click(screen.getByRole("button", { name: "Help: find a feature" }))

    const box = screen.getByRole("searchbox", { name: "Search pages" })
    await user.type(box, "zzzz-nothing")
    expect(await screen.findByText(/Nothing found for/)).toBeInTheDocument()
  })
})
