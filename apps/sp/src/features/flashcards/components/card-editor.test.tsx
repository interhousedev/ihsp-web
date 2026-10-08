import { describe, expect, it } from "bun:test"
import { apiUrl, flashcardCards, flashcardSetDetail, ids, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, enter, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { CardEditor } from "./card-editor"

allowSlowRenders()

const route = `/flashcards/edit/?id=${ids.flashcardSet}`

function recordSave() {
  const saved: unknown[] = []
  server.use(
    http.put(apiUrl(`/v1/me/flashcard-sets/${ids.flashcardSet}/cards`), async ({ request }) => {
      const body = await readBody(request)
      saved.push(body)
      const cards = (body as { cards: { id?: string; front: string; back: string }[] }).cards.map((card, index) => ({
        id: card.id ?? `0000000e-0000-4000-8000-0000000000${index + 10}`,
        position: index + 1,
        front: card.front,
        back: card.back,
        state: "new",
        due_at: null,
      }))
      return HttpResponse.json({ ...flashcardSetDetail, card_count: cards.length, cards })
    }),
  )
  return saved
}

describe("CardEditor (UF-WEB-23, WEB-24)", () => {
  it("lists the cards of the set in order with Save disabled until something changes", async () => {
    renderTools(<CardEditor />, { route })

    expect(await screen.findByLabelText("Front of card 1")).toHaveValue("What is velocity?")
    expect(screen.getByLabelText("Front of card 4")).toHaveValue("Free fall acceleration on Earth")
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
  })

  it("sends the full ordered list after a card is moved", async () => {
    const saved = recordSave()
    const { user } = renderTools(<CardEditor />, { route })
    await screen.findByLabelText("Front of card 1")

    await user.click(screen.getByRole("button", { name: "Move card 1 down" }))
    expect(screen.getByLabelText("Front of card 1")).toHaveValue("What is acceleration?")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(saved).toHaveLength(1))
    expect(saved[0]).toEqual({
      cards: [flashcardCards[1], flashcardCards[0], flashcardCards[2], flashcardCards[3]].map((card) => ({
        id: card?.id,
        front: card?.front,
        back: card?.back,
      })),
    })
    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith(`/flashcards/set/?id=${ids.flashcardSet}`))
  })

  it("leaves a deleted card out of the list and sends new cards without an id", async () => {
    const saved = recordSave()
    const { user } = renderTools(<CardEditor />, { route })
    await screen.findByLabelText("Front of card 1")

    await user.click(screen.getByRole("button", { name: "Delete card 4" }))
    await user.click(screen.getByRole("button", { name: "Delete card 3" }))
    await user.click(screen.getByRole("button", { name: "Add card" }))
    await enter(user, screen.getByLabelText("Front of card 3"), "Newton's first law")
    await enter(user, screen.getByLabelText("Back of card 3"), "A body keeps its velocity without a net force.")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(saved).toHaveLength(1))
    expect(saved[0]).toEqual({
      cards: [
        { id: flashcardCards[0]?.id, front: flashcardCards[0]?.front, back: flashcardCards[0]?.back },
        { id: flashcardCards[1]?.id, front: flashcardCards[1]?.front, back: flashcardCards[1]?.back },
        { front: "Newton's first law", back: "A body keeps its velocity without a net force." },
      ],
    })
  })

  it("does not save a card with an empty side", async () => {
    const saved = recordSave()
    const { user } = renderTools(<CardEditor />, { route })
    await screen.findByLabelText("Front of card 1")

    await user.click(screen.getByRole("button", { name: "Add card" }))
    await enter(user, screen.getByLabelText("Front of card 5"), "Only a question")
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("Fill in both sides or delete this card.")).toBeInTheDocument()
    expect(saved).toHaveLength(0)
  })

  it("shows the Markdown of a card when the preview is on", async () => {
    const { user } = renderTools(<CardEditor />, { route })
    await screen.findByLabelText("Front of card 1")
    await enter(user, screen.getByLabelText("Back of card 2"), "The **rate** of change")

    await user.click(screen.getByRole("checkbox", { name: "Show Markdown preview" }))

    expect(screen.getByText("rate", { selector: "strong" })).toBeInTheDocument()
  })
})
