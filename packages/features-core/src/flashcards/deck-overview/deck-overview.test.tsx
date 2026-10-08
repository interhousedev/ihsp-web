import { describe, expect, it, mock } from "bun:test"
import { flashcardStats, renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { DeckOverview } from "./deck-overview"

const base = {
  title: "Physics: kinematics",
  description: "Key definitions and formulas",
  counts: { new: 100, learning: 39, review: 98 },
  cardCount: 400,
  studyHref: "/flashcards/study?id=1",
}

describe("DeckOverview (Anki's deck overview)", () => {
  it("shows the title, description and the three counts", () => {
    renderWithProviders(<DeckOverview {...base} />)

    expect(screen.getByRole("heading", { name: "Physics: kinematics" })).toBeInTheDocument()
    expect(screen.getByText("Key definitions and formulas")).toBeInTheDocument()
    expect(screen.getByText("New:").nextElementSibling).toHaveTextContent("100")
    expect(screen.getByText("Learning:").nextElementSibling).toHaveTextContent("39")
    expect(screen.getByText("To review:").nextElementSibling).toHaveTextContent("98")
  })

  it("colors the counts like the deck list", () => {
    renderWithProviders(<DeckOverview {...base} />)

    expect(screen.getByText("New:").nextElementSibling?.className).toContain("text-blue")
    expect(screen.getByText("Learning:").nextElementSibling?.className).toContain("text-red")
    expect(screen.getByText("To review:").nextElementSibling?.className).toContain("text-green")
  })

  it("has a big Study now link to the study screen", () => {
    renderWithProviders(<DeckOverview {...base} />)

    expect(screen.getByRole("link", { name: "Study now" })).toHaveAttribute("href", "/flashcards/study?id=1")
  })

  it("congratulates instead when nothing is left today", () => {
    renderWithProviders(<DeckOverview {...base} counts={{ new: 0, learning: 0, review: 0 }} />)

    expect(screen.getByText("Congratulations! You have finished this deck for now.")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Study now" })).not.toBeInTheDocument()
  })

  it("points an empty deck to the editor", () => {
    renderWithProviders(<DeckOverview {...base} cardCount={0} counts={{ new: 0, learning: 0, review: 0 }} />)

    expect(screen.getByText(/This deck has no cards yet/)).toBeInTheDocument()
  })

  it("shows the heatmap and statistics of the deck when given", () => {
    renderWithProviders(<DeckOverview {...base} stats={flashcardStats} />)

    expect(screen.getByTestId("review-heatmap")).toBeInTheDocument()
    expect(screen.getByText("Current streak:")).toBeInTheDocument()
  })

  it("shows the bottom buttons whose callbacks are given", async () => {
    const onOptions = mock(() => undefined)
    const { user } = renderWithProviders(<DeckOverview {...base} onOptions={onOptions} onEditCards={() => undefined} />)

    expect(screen.getByRole("button", { name: "Edit cards" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Description" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Options" }))
    expect(onOptions).toHaveBeenCalledTimes(1)
  })
})
