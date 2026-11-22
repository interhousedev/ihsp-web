import { describe, expect, it } from "bun:test"
import { fireEvent, screen } from "@testing-library/react"
import { renderAdmissionApp } from "../../../tests/helpers"
import { MatchExtrasView, type CardMatch } from "./match-extras"

const base = {
  description: null,
  fields: [],
  rankings: [],
  map_url: null,
  cost_usd: 48000,
  net_cost_usd: null,
  aid_estimate_usd: null,
  experience: [
    { key: "social", score: 4, note: null },
    { key: "research", score: 5, note: null },
    { key: "work", score: 3, note: null },
  ],
} as unknown as CardMatch

describe("MatchExtrasView", () => {
  it("shows the gross price with an info button when no aid estimate exists", () => {
    renderAdmissionApp(<MatchExtrasView match={base} />)
    fireEvent.click(screen.getByRole("button", { name: /Costs & scores/ }))
    expect(screen.getByText(/48,000/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "How is this estimated?" }))
    expect(screen.getByRole("tooltip").textContent).toContain("before any aid")
  })

  it("shows the net price and the sticker price when aid is estimated", () => {
    renderAdmissionApp(
      <MatchExtrasView match={{ ...base, net_cost_usd: 36000, aid_estimate_usd: 12000 } as CardMatch} />,
    )
    fireEvent.click(screen.getByRole("button", { name: /Costs & scores/ }))
    expect(screen.getByText(/36,000/)).toBeTruthy()
    expect(screen.getByText(/48,000/)).toBeTruthy()
  })

  it("gives every experience meter an info button that opens on tap", () => {
    renderAdmissionApp(<MatchExtrasView match={base} />)
    fireEvent.click(screen.getByRole("button", { name: /Costs & scores/ }))
    const buttons = screen.getAllByRole("button", { name: /^About:/ })
    expect(buttons).toHaveLength(3)
    fireEvent.focus(buttons[0]!)
    fireEvent.click(buttons[0]!)
    expect(screen.getByRole("tooltip")).toBeTruthy()
  })

  it("marks the price against the budget and hides the chip when it is unknown", () => {
    const { unmount } = renderAdmissionApp(<MatchExtrasView match={{ ...base, budget_fit: "fits" } as CardMatch} />)
    fireEvent.click(screen.getByRole("button", { name: /Costs & scores/ }))
    expect(screen.getByTestId("budget-fit").textContent).toBe("Fits budget")
    unmount()
    const above = renderAdmissionApp(<MatchExtrasView match={{ ...base, budget_fit: "above" } as CardMatch} />)
    fireEvent.click(screen.getByRole("button", { name: /Costs & scores/ }))
    expect(screen.getByTestId("budget-fit").textContent).toBe("Above budget")
    above.unmount()
    renderAdmissionApp(<MatchExtrasView match={{ ...base, budget_fit: null } as CardMatch} />)
    fireEvent.click(screen.getByRole("button", { name: /Costs & scores/ }))
    expect(screen.queryByTestId("budget-fit")).toBeNull()
  })

  it("keeps the card compact: four chips and a +N, the headline QS rank, long sections behind buttons", () => {
    const heavy = {
      ...base,
      name: "Harvard",
      fields: ["a", "b", "c", "d", "e", "f"],
      rankings: [{ system: "qs", subject: "overall", rank: 4, year: 2026, source_url: "https://x.test" }],
      focuses: [{ text: "Curiosity", quote: "We value it", source_url: "https://x.test/p" }],
    } as unknown as CardMatch
    renderAdmissionApp(<MatchExtrasView match={heavy} />)
    expect(screen.getByText("QS #4 · 2026")).toBeTruthy()
    expect(screen.getByText("+2")).toBeTruthy()
    expect(screen.queryByText("We value it")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /What it looks for/ }))
    expect(screen.getByText("We value it")).toBeTruthy()
  })
})
