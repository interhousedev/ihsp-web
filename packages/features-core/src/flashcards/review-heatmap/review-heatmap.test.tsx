import { describe, expect, it, mock } from "bun:test"
import { flashcardStats, flashcardStatsEmpty, renderWithProviders } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { ReviewHeatmap } from "./review-heatmap"

const TODAY = "2026-10-07"

function cell(container: HTMLElement, date: string): HTMLElement {
  const found = container.querySelector<HTMLElement>(`[data-date="${date}"]`)
  if (!found) throw new Error(`no cell for ${date}`)
  return found
}

describe("ReviewHeatmap (Anki's calendar under the deck list)", () => {
  it("draws a square per day of the year with the count and a level", () => {
    const { container } = renderWithProviders(<ReviewHeatmap stats={flashcardStats} today={TODAY} />)

    expect(container.querySelectorAll("[data-date]")).toHaveLength(365)
    expect(cell(container, "2026-09-29")).toHaveAttribute("data-count", "41")
    expect(cell(container, "2026-09-29")).toHaveAttribute("data-level", "4")
    expect(cell(container, "2026-09-24")).toHaveAttribute("data-count", "0")
    expect(cell(container, "2026-09-24")).toHaveAttribute("data-level", "0")
  })

  it("describes a day in its tooltip", () => {
    const { container } = renderWithProviders(<ReviewHeatmap stats={flashcardStats} today={TODAY} />)

    expect(cell(container, "2026-09-29").title).toBe("41 reviews on 29 September 2026")
    expect(cell(container, "2026-09-24").title).toBe("No reviews on 24 September 2026")
  })

  it("names the whole heatmap for screen readers", () => {
    renderWithProviders(<ReviewHeatmap stats={flashcardStats} today={TODAY} />)

    expect(screen.getByRole("img", { name: "Reviews in 2026: 213 reviews on 11 days" })).toBeInTheDocument()
  })

  it("shows the four numbers under the grid", () => {
    renderWithProviders(<ReviewHeatmap stats={flashcardStats} today={TODAY} />)

    const summary = screen.getByText("Daily average:").closest("dl") as HTMLElement
    expect(within(summary).getByText("Daily average:").nextSibling).toHaveTextContent("19.4 cards")
    expect(within(summary).getByText("Days learned:").nextSibling).toHaveTextContent("44%")
    expect(within(summary).getByText("Longest streak:").nextSibling).toHaveTextContent("5 days")
    expect(within(summary).getByText("Current streak:").nextSibling).toHaveTextContent("3 days")
  })

  it("navigates between years but not before the first review or after this year", async () => {
    const onYearChange = mock((_year: number) => undefined)
    const { user, rerender } = renderWithProviders(
      <ReviewHeatmap stats={flashcardStats} onYearChange={onYearChange} today={TODAY} />,
    )

    expect(screen.getByRole("button", { name: "Previous year" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Next year" })).toBeDisabled()

    rerender(
      <ReviewHeatmap
        stats={{ ...flashcardStats, first_review_date: "2025-03-01" }}
        onYearChange={onYearChange}
        today={TODAY}
      />,
    )
    await user.click(screen.getByRole("button", { name: "Previous year" }))

    expect(onYearChange).toHaveBeenCalledWith(2025)
  })

  it("can go back to this year from another one", async () => {
    const onYearChange = mock((_year: number) => undefined)
    const { user } = renderWithProviders(
      <ReviewHeatmap
        stats={{ ...flashcardStatsEmpty, first_review_date: "2024-01-01" }}
        onYearChange={onYearChange}
        today={TODAY}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Back to this year" }))
    expect(onYearChange).toHaveBeenCalledWith(2026)
    expect(screen.getByRole("button", { name: "Next year" })).toBeEnabled()
  })

  it("shows no navigation without a year handler", () => {
    renderWithProviders(<ReviewHeatmap stats={flashcardStats} today={TODAY} />)

    expect(screen.queryByRole("button", { name: "Previous year" })).not.toBeInTheDocument()
  })
})
