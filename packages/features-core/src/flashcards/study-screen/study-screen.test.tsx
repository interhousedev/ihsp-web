import { describe, expect, it, mock } from "bun:test"
import type { ReviewRating } from "@ihsp/api"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { StudyScreen, type StudyScreenProps } from "./study-screen"

const card = { id: "c1", front: "What is velocity?", back: "The rate of change of position.", state: "review" }
const intervals = { again: "1m", hard: "10m", medium: "1d", easy: "3d" }
const counts = { new: 49, learning: 7, review: 104 }

function setup(props: Partial<StudyScreenProps> = {}) {
  const onRate = mock((_rating: ReviewRating, _durationMs: number) => undefined)
  const view = renderWithProviders(
    <StudyScreen card={card} intervals={intervals} counts={counts} onRate={onRate} {...props} />,
  )
  return { ...view, onRate }
}

describe("StudyScreen (Anki's study screen)", () => {
  it("shows the question and a Show answer button, but not the answer yet", () => {
    setup()

    expect(screen.getByText("What is velocity?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Show answer" })).toBeInTheDocument()
    expect(screen.queryByText("The rate of change of position.")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Good" })).not.toBeInTheDocument()
  })

  it("shows a separator and the answer after Show answer", async () => {
    const { user } = setup()

    await user.click(screen.getByRole("button", { name: "Show answer" }))

    expect(screen.getByTestId("card-back")).toHaveTextContent("The rate of change of position.")
    expect(screen.getByTestId("card-back").previousElementSibling?.tagName).toBe("HR")
    expect(screen.queryByRole("button", { name: "Show answer" })).not.toBeInTheDocument()
  })

  it("shows Again, Hard, Good and Easy with the next interval above each (<1m, <10m, 1d, 3d)", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: "Show answer" }))

    const group = screen.getByRole("group", { name: "How well did you know it?" })
    const labels = within(group)
      .getAllByRole("button")
      .map((button) => ({
        name: button.textContent,
        interval: document.getElementById(button.getAttribute("aria-describedby") ?? "")?.textContent,
      }))
    expect(labels).toEqual([
      { name: "Again", interval: "<1m" },
      { name: "Hard", interval: "<10m" },
      { name: "Good", interval: "1d" },
      { name: "Easy", interval: "3d" },
    ])
  })

  it("shows the counts as 49 + 7 + 104 with the queue of the card underlined", () => {
    setup()

    const counts = screen.getByTestId("study-counts")
    expect(counts).toHaveTextContent("49+7+104")
    const current = counts.querySelector("[data-current='true']")
    expect(current).toHaveTextContent("104")
    expect(current?.className).toContain("underline")
    expect(current?.className).toContain("text-green")
    expect(counts.querySelector("[data-queue='new']")?.className).toContain("text-blue")
    expect(counts.querySelector("[data-queue='learning']")?.className).toContain("text-red")
  })

  it("underlines the learning queue for a card that is being learned", () => {
    setup({ card: { ...card, state: "relearning" } })

    expect(screen.getByTestId("study-counts").querySelector("[data-current='true']")).toHaveTextContent("7")
  })

  it("underlines nothing when the queue is unknown", () => {
    setup({ card: { id: "c1", front: "Q", back: "A" } })

    expect(screen.getByTestId("study-counts").querySelector("[data-current='true']")).toBeNull()
  })

  it("rates with a click and reports the time the card was on screen", async () => {
    const { user, onRate } = setup()
    await user.click(screen.getByRole("button", { name: "Show answer" }))

    await user.click(screen.getByRole("button", { name: "Hard" }))

    expect(onRate).toHaveBeenCalledTimes(1)
    const [rating, duration] = onRate.mock.calls[0] ?? []
    expect(rating).toBe("hard")
    expect(duration).toBeGreaterThanOrEqual(0)
    expect(duration).toBeLessThan(5000)
  })

  it("shows the answer with Space and with Enter", async () => {
    const first = setup()
    await first.user.keyboard(" ")
    expect(screen.getByTestId("card-back")).toBeInTheDocument()
    first.unmount()

    const second = setup()
    await second.user.keyboard("{Enter}")
    expect(screen.getByTestId("card-back")).toBeInTheDocument()
  })

  it("rates with the keys 1 to 4 once the answer is shown", async () => {
    const { user, onRate, rerender } = setup()

    for (const [index, key] of ["1", "2", "3", "4"].entries()) {
      await user.keyboard(" ")
      await user.keyboard(key)
      expect(onRate).toHaveBeenCalledTimes(index + 1)
      // A new card (or the same one after a review) starts hidden again.
      rerender(<StudyScreen card={card} intervals={intervals} counts={counts} onRate={onRate} reviewed={index + 1} />)
      expect(screen.queryByTestId("card-back")).not.toBeInTheDocument()
    }

    expect(onRate.mock.calls.map((call) => call[0])).toEqual(["again", "hard", "medium", "easy"])
  })

  it("answers Good with Space or Enter after the answer is shown", async () => {
    const { user, onRate } = setup()
    await user.keyboard(" ")
    await new Promise((resolve) => setTimeout(resolve, 300))

    await user.keyboard("{Enter}")

    expect(onRate.mock.calls.map((call) => call[0])).toEqual(["medium"])
  })

  it("does not answer Good when Space is pressed twice at once", async () => {
    const { user, onRate } = setup()

    await user.keyboard("  ")

    expect(screen.getByTestId("card-back")).toBeInTheDocument()
    expect(onRate).not.toHaveBeenCalled()
  })

  it("ignores rating keys before the answer is shown", async () => {
    const { user, onRate } = setup()

    await user.keyboard("3")

    expect(onRate).not.toHaveBeenCalled()
    expect(screen.queryByTestId("card-back")).not.toBeInTheDocument()
  })

  it("leaves keys typed into a field alone", async () => {
    const { user, onRate } = setup()
    const field = document.createElement("input")
    document.body.append(field)
    field.focus()

    await user.keyboard(" 3")

    expect(screen.queryByTestId("card-back")).not.toBeInTheDocument()
    expect(onRate).not.toHaveBeenCalled()
    field.remove()
  })

  it("waits while a rating is on its way", async () => {
    const { user, onRate } = setup({ isRating: true })

    await user.keyboard(" ")

    expect(screen.queryByTestId("card-back")).not.toBeInTheDocument()
    expect(onRate).not.toHaveBeenCalled()
  })

  it("shows the error of the last rating under the card", () => {
    setup({ error: "Could not save the answer." })

    expect(screen.getByRole("alert")).toHaveTextContent("Could not save the answer.")
  })

  it("has Edit and Limits buttons at the top when asked", async () => {
    const onEdit = mock(() => undefined)
    const onLimits = mock(() => undefined)
    const { user } = setup({ onEdit, onLimits })

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Limits" }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onLimits).toHaveBeenCalledTimes(1)
  })

  it("has no Edit and Limits buttons in the embedded form", () => {
    setup({ variant: "embedded", onEdit: () => undefined, onLimits: () => undefined })

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Show answer" })).toBeInTheDocument()
  })

  it("congratulates when no card is left and links back to the deck", () => {
    setup({ card: null, reviewed: 12, exitHref: "/flashcards/set?id=1", counts: { new: 0, learning: 0, review: 0 } })

    expect(screen.getByText("Congratulations! You have finished this deck for now.")).toBeInTheDocument()
    expect(screen.getByText("You answered 12 cards.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back to the deck" })).toHaveAttribute("href", "/flashcards/set?id=1")
  })

  it("renders Markdown on both sides", async () => {
    const { user } = setup({ card: { id: "m", front: "**bold** term", back: "- one\n- two" } })

    expect(screen.getByText("bold").tagName).toBe("STRONG")
    await user.keyboard(" ")
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(2))
  })
})
