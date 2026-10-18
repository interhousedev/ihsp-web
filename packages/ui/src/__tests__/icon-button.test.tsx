import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { IconShare } from "../components/icons"
import { IconButton } from "../components/ui/icon-button"

describe("IconButton", () => {
  it("is named by its aria-label and calls onClick", async () => {
    let clicks = 0
    const { user } = renderWithProviders(<IconButton icon={IconShare} aria-label="Share" onClick={() => clicks++} />)
    const btn = screen.getByRole("button", { name: "Share" })
    expect(btn).toHaveAttribute("type", "button")
    await user.click(btn)
    expect(clicks).toBe(1)
  })

  it("shows the label as a tooltip on hover", async () => {
    const { user } = renderWithProviders(<IconButton icon={IconShare} aria-label="Share" />)
    await user.tab()
    expect(await screen.findByText("Share", { selector: "[data-slot='tooltip-content']" })).toBeInTheDocument()
  })

  it("requires aria-label at the type level", () => {
    // @ts-expect-error aria-label is required
    renderWithProviders(<IconButton icon={IconShare} />)
  })
})
