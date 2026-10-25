import { describe, expect, it, mock } from "bun:test"
import {
  flashcardSetAi,
  flashcardSetPhysics,
  flashcardSets,
  flashcardStats,
  renderWithProviders,
} from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { DeckList } from "./deck-list"

const href = (id: string) => `/flashcards/set?id=${id}`

function row(title: string): HTMLElement {
  const link = screen.getByRole("link", { name: title })
  return link.closest("tr") as HTMLElement
}

describe("DeckList (Anki's deck list)", () => {
  it("shows a table with the headers Deck, New, Learn and Due", () => {
    renderWithProviders(<DeckList decks={flashcardSets} getDeckHref={href} onCreateDeck={() => undefined} />)

    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent)
    expect(headers.slice(0, 4)).toEqual(["Deck", "New", "Learn", "Due"])
  })

  it("lists each deck with its three counts and a link to its overview", () => {
    renderWithProviders(<DeckList decks={flashcardSets} getDeckHref={href} onCreateDeck={() => undefined} />)

    const physics = row(flashcardSetPhysics.title)
    const cells = within(physics).getAllByRole("cell")
    expect(cells.slice(0, 3).map((cell) => cell.textContent)).toEqual(["2", "1", "1"])
    expect(within(physics).getByRole("link", { name: flashcardSetPhysics.title })).toHaveAttribute(
      "href",
      href(flashcardSetPhysics.id),
    )
    const english = within(row(flashcardSetAi.title)).getAllByRole("cell")
    expect(english.slice(0, 3).map((cell) => cell.textContent)).toEqual(["10", "0", "0"])
  })

  it("colors New blue, Learn red and Due green, and greys out zeros", () => {
    renderWithProviders(<DeckList decks={flashcardSets} getDeckHref={href} onCreateDeck={() => undefined} />)

    const [newCell, learnCell, dueCell] = within(row(flashcardSetPhysics.title)).getAllByRole("cell")
    expect(newCell?.firstElementChild?.className).toContain("text-blue")
    expect(learnCell?.firstElementChild?.className).toContain("text-red")
    expect(dueCell?.firstElementChild?.className).toContain("text-green")
    const [, learnZero] = within(row(flashcardSetAi.title)).getAllByRole("cell")
    expect(learnZero?.firstElementChild?.className).toContain("text-muted-foreground")
  })

  it("marks a deck made by the assistant, MCP or a copy, but not a manual one", () => {
    renderWithProviders(
      <DeckList
        decks={[
          { ...flashcardSetPhysics, source: "manual" },
          { ...flashcardSetAi, source: "ai" },
          { ...flashcardSetAi, id: "x", title: "Copy", source: "copied" },
        ]}
        getDeckHref={href}
        onCreateDeck={() => undefined}
      />,
    )

    expect(within(row(flashcardSetPhysics.title)).queryByText("Assistant")).not.toBeInTheDocument()
    expect(within(row(flashcardSetAi.title)).getByText("Assistant")).toBeInTheDocument()
    expect(within(row("Copy")).getByText("Copied")).toBeInTheDocument()
  })

  it("explains an empty list", () => {
    renderWithProviders(<DeckList decks={[]} getDeckHref={href} onCreateDeck={() => undefined} />)

    expect(screen.getByText(/No decks yet/)).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("shows today's numbers and the heatmap when statistics are given", () => {
    renderWithProviders(
      <DeckList decks={flashcardSets} stats={flashcardStats} getDeckHref={href} onCreateDeck={() => undefined} />,
    )

    expect(screen.getByText("Studied 9 cards in 74 seconds today (8.2s/card)")).toBeInTheDocument()
    expect(screen.getByTestId("review-heatmap")).toBeInTheDocument()
    expect(screen.getByText("Longest streak:")).toBeInTheDocument()
  })

  it("says so when nothing was studied today", () => {
    renderWithProviders(
      <DeckList
        decks={flashcardSets}
        stats={{ ...flashcardStats, today_count: 0, today_seconds: 0 }}
        getDeckHref={href}
        onCreateDeck={() => undefined}
      />,
    )

    expect(screen.getByText("No cards studied today yet.")).toBeInTheDocument()
  })

  it("has the buttons Get shared, Create deck and Import file", async () => {
    const onCreateDeck = mock(() => undefined)
    const { user } = renderWithProviders(
      <DeckList
        decks={flashcardSets}
        getDeckHref={href}
        onCreateDeck={onCreateDeck}
        onImportFile={() => undefined}
        onGetShared={() => undefined}
      />,
    )

    expect(screen.getByRole("button", { name: "Get shared" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Import file" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Create deck" }))
    expect(onCreateDeck).toHaveBeenCalledTimes(1)
  })

  it("hands the chosen file to Import file", async () => {
    const onImportFile = mock((_file: File) => undefined)
    renderWithProviders(
      <DeckList decks={[]} getDeckHref={href} onCreateDeck={() => undefined} onImportFile={onImportFile} />,
    )
    const file = new File(["a\tb"], "words.txt", { type: "text/plain" })

    fireEvent.change(screen.getByTestId("deck-import-input"), { target: { files: [file] } })

    expect(onImportFile).toHaveBeenCalledWith(file)
  })

  it("copies a shared deck from a pasted link", async () => {
    const onGetShared = mock((_slug: string) => undefined)
    const { user } = renderWithProviders(
      <DeckList decks={[]} getDeckHref={href} onCreateDeck={() => undefined} onGetShared={onGetShared} />,
    )

    await user.click(screen.getByRole("button", { name: "Get shared" }))
    await user.type(await screen.findByLabelText("Share link or code"), "https://share.ihsp.uz/ai/zr5t8w1c/")
    await user.click(screen.getByRole("button", { name: "Copy to my decks" }))

    expect(onGetShared).toHaveBeenCalledWith("zr5t8w1c")
  })

  it("refuses text that is not a share link", async () => {
    const onGetShared = mock((_slug: string) => undefined)
    const { user } = renderWithProviders(
      <DeckList decks={[]} getDeckHref={href} onCreateDeck={() => undefined} onGetShared={onGetShared} />,
    )

    await user.click(screen.getByRole("button", { name: "Get shared" }))
    await user.type(await screen.findByLabelText("Share link or code"), "not a link")
    await user.click(screen.getByRole("button", { name: "Copy to my decks" }))

    expect(await screen.findByText("This is not a share link.")).toBeInTheDocument()
    expect(onGetShared).not.toHaveBeenCalled()
  })

  it("opens the gear menu of a row with Options, Edit cards and Delete", async () => {
    const onOptions = mock((_deck: unknown) => undefined)
    const onDelete = mock((_deck: unknown) => undefined)
    const { user } = renderWithProviders(
      <DeckList
        decks={flashcardSets}
        getDeckHref={href}
        onCreateDeck={() => undefined}
        onDeckOptions={onOptions}
        onDeckEdit={() => undefined}
        onDeckDelete={onDelete}
      />,
    )

    await user.click(screen.getByRole("button", { name: `Options for ${flashcardSetPhysics.title}` }))
    expect(await screen.findByRole("menuitem", { name: "Edit cards" })).toBeInTheDocument()
    await user.click(screen.getByRole("menuitem", { name: "Options" }))

    await waitFor(() => expect(onOptions).toHaveBeenCalledWith(flashcardSetPhysics))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("has no gear column without row callbacks", () => {
    renderWithProviders(<DeckList decks={flashcardSets} getDeckHref={href} onCreateDeck={() => undefined} />)

    expect(screen.queryByRole("button", { name: /^Options for/ })).not.toBeInTheDocument()
  })
})
