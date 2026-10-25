import { describe, expect, it, spyOn } from "bun:test"
import {
  apiUrl,
  flashcardSetPhysics,
  flashcardSets,
  flashcardStats,
  ids,
  problem,
  server,
  testRouter,
} from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { allowSlowRenders, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { FlashcardSetsPage } from "./flashcard-sets-page"

allowSlowRenders()

describe("FlashcardSetsPage (WEB-22, Anki's deck list)", () => {
  it("lists the decks with New, Learn and Due counts", async () => {
    renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })

    const link = await screen.findByRole("link", { name: flashcardSetPhysics.title })

    expect(link).toHaveAttribute("href", `/flashcards/set?id=${ids.flashcardSet}`)
    const cells = within(link.closest("tr") as HTMLElement).getAllByRole("cell")
    expect(cells.slice(0, 3).map((cell) => cell.textContent)).toEqual(["2", "1", "1"])
    expect(screen.getByRole("link", { name: flashcardSets[1]?.title ?? "" })).toBeInTheDocument()
  })

  it("shows today's numbers, the heatmap and the streaks from the statistics", async () => {
    renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })

    expect(await screen.findByText("Studied 9 cards in 74 seconds today (8.2s/card)")).toBeInTheDocument()
    expect(screen.getByTestId("review-heatmap")).toBeInTheDocument()
    expect(screen.getByText("Longest streak:").nextSibling).toHaveTextContent("5 days")
  })

  it("asks for another year of the heatmap with the arrows", async () => {
    const years: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/me/flashcard-sets/stats"), ({ request }) => {
        years.push(new URL(request.url).searchParams.get("year"))
        return HttpResponse.json({
          ...flashcardStats,
          year: years.length === 1 ? 2026 : 2025,
          first_review_date: "2025-01-01",
        })
      }),
    )
    const { user } = renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })
    await screen.findByTestId("review-heatmap")

    await user.click(screen.getByRole("button", { name: "Previous year" }))

    await waitFor(() => expect(years).toEqual([null, "2025"]))
  })

  it("has Create deck, Import file and Get shared", async () => {
    const { user } = renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })
    await screen.findByRole("link", { name: flashcardSetPhysics.title })

    await user.click(screen.getByRole("button", { name: "Create deck" }))
    expect(testRouter.push).toHaveBeenCalledWith("/flashcards/edit/")

    await user.click(screen.getByRole("button", { name: "Get shared" }))
    await user.type(await screen.findByLabelText("Share link or code"), "https://share.example/ai/zr5t8w1c/")
    await user.click(screen.getByRole("button", { name: "Copy to my decks" }))
    expect(testRouter.push).toHaveBeenCalledWith("/flashcards/copy/?share=zr5t8w1c")
  })

  it("imports a tab separated file as a new deck named after the file", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/me/flashcard-sets"), async ({ request }) => {
        bodies.push(await readBody(request))
        return HttpResponse.json({
          ...flashcardSetPhysics,
          id: "0000000c-0000-4000-8000-0000000000aa",
          title: "words",
          card_count: 2,
          new_per_day: 20,
          reviews_per_day: 200,
          cards: [],
        })
      }),
    )
    renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })
    await screen.findByRole("link", { name: flashcardSetPhysics.title })

    const file = new File(["cat\tкошка\ndog\tсобака\n"], "words.txt", { type: "text/plain" })
    fireEvent.change(screen.getByTestId("deck-import-input"), { target: { files: [file] } })

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          title: "words",
          cards: [
            { front: "cat", back: "кошка" },
            { front: "dog", back: "собака" },
          ],
        },
      ]),
    )
    await waitFor(() =>
      expect(testRouter.push).toHaveBeenCalledWith("/flashcards/set/?id=0000000c-0000-4000-8000-0000000000aa"),
    )
  })

  it("does not create a deck from a file without cards", async () => {
    const toastError = spyOn(toast, "error").mockImplementation(() => "")
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/me/flashcard-sets"), async ({ request }) => {
        bodies.push(await readBody(request))
        return HttpResponse.json({})
      }),
    )
    renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })
    await screen.findByRole("link", { name: flashcardSetPhysics.title })

    fireEvent.change(screen.getByTestId("deck-import-input"), {
      target: { files: [new File(["no separator here"], "notes.txt", { type: "text/plain" })] },
    })

    await waitFor(() => expect(toastError).toHaveBeenCalled())
    expect(String(toastError.mock.calls[0]?.[0])).toContain("No cards found in the file")
    expect(bodies).toEqual([])
  })

  it("opens the options of a deck from its gear menu", async () => {
    const { user } = renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })

    await user.click(await screen.findByRole("button", { name: `Options for ${flashcardSetPhysics.title}` }))
    await user.click(await screen.findByRole("menuitem", { name: "Options" }))

    expect(testRouter.push).toHaveBeenCalledWith(`/flashcards/set/?id=${ids.flashcardSet}&options=1`)
  })

  it("deletes a deck after confirmation", async () => {
    const deleted: string[] = []
    server.use(
      http.delete(apiUrl("/v1/me/flashcard-sets/:id"), ({ params }) => {
        deleted.push(String(params.id))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })

    await user.click(await screen.findByRole("button", { name: `Options for ${flashcardSetPhysics.title}` }))
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Delete deck" }))

    await waitFor(() => expect(deleted).toEqual([ids.flashcardSet]))
  })

  it("shows the error when the decks cannot be loaded", async () => {
    server.use(http.get(apiUrl("/v1/me/flashcard-sets"), () => problem(500, "internal-error", "Internal error")))
    renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })

    expect(await screen.findByRole("button", { name: /retry|try again/i })).toBeInTheDocument()
  })
})
