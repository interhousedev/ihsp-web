import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TierPicker } from "./tier-picker"

async function openPicker(smart: { remaining: number; limit: number; resetsAt: string | null } | null) {
  const user = userEvent.setup({ pointerEventsCheck: 0 })
  renderWithProviders(<TierPicker value="fast" onChange={() => {}} smart={smart} />)
  await user.click(screen.getByRole("button", { name: /Answer mode/ }))
  return within(await screen.findByRole("menu"))
}

describe("TierPicker", () => {
  it("shows the smart requests left this week", async () => {
    const menu = await openPicker({ remaining: 2, limit: 3, resetsAt: "2026-10-11T19:00:00Z" })

    expect(menu.getByRole("menuitemradio", { name: "Smart: 2 of 3 left this week" })).toBeInTheDocument()
  })

  it("disables smart at zero and says when it resets", async () => {
    const menu = await openPicker({ remaining: 0, limit: 3, resetsAt: "2026-10-11T19:00:00Z" })

    const smart = menu.getByRole("menuitemradio", { name: /none left, resets/ })
    expect(smart).toHaveAttribute("aria-disabled", "true")
    expect(menu.getByRole("menuitemradio", { name: "Fast" })).not.toHaveAttribute("aria-disabled", "true")
  })

  it("shows plain smart without a weekly limit (staff)", async () => {
    const menu = await openPicker(null)

    expect(menu.getByRole("menuitemradio", { name: "Smart" })).not.toHaveAttribute("aria-disabled", "true")
  })
})
