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
    expect(screen.getByText(/48,000/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "How is this estimated?" }))
    expect(screen.getByRole("tooltip").textContent).toContain("before any aid")
  })

  it("shows the net price and the sticker price when aid is estimated", () => {
    renderAdmissionApp(
      <MatchExtrasView match={{ ...base, net_cost_usd: 36000, aid_estimate_usd: 12000 } as CardMatch} />,
    )
    expect(screen.getByText(/36,000/)).toBeTruthy()
    expect(screen.getByText(/48,000/)).toBeTruthy()
  })

  it("gives every experience meter an info button that opens on tap", () => {
    renderAdmissionApp(<MatchExtrasView match={base} />)
    const buttons = screen.getAllByRole("button", { name: /^About:/ })
    expect(buttons).toHaveLength(3)
    fireEvent.focus(buttons[0]!)
    fireEvent.click(buttons[0]!)
    expect(screen.getByRole("tooltip")).toBeTruthy()
  })
})
