import { describe, expect, it } from "bun:test"
import { apiUrl, flashcardCards, flashcardSetDetail, ids, server, testRouter } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { CardEditorPage } from "./card-editor-page"

allowSlowRenders()

function rowFields(index: number) {
  const row = within(screen.getByRole("list", { name: "Cards" })).getAllByRole("listitem")[index] as HTMLElement
  const [term, definition] = within(row).getAllByRole("textbox") as HTMLTextAreaElement[]
  return { row, term: term as HTMLTextAreaElement, definition: definition as HTMLTextAreaElement }
}

function createButton(name: string): HTMLElement {
  return screen.getAllByRole("button", { name })[0] as HTMLElement
}

describe("CardEditorPage, new deck (Quizlet style)", () => {
  it("creates a deck from the typed cards and opens its overview", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/me/flashcard-sets"), async ({ request }) => {
        bodies.push(await readBody(request))
        return HttpResponse.json({
          ...flashcardSetDetail,
          id: "0000000c-0000-4000-8000-0000000000bb",
          title: "Animals",
        })
      }),
    )
    const { user } = renderTools(<CardEditorPage />, { route: "/flashcards/edit/" })

    await user.type(screen.getByLabelText("Title"), "Animals")
    await user.type(rowFields(0).term, "cat")
    await user.type(rowFields(0).definition, "кошка")
    await user.click(createButton("Create"))

    await waitFor(() => expect(bodies).toEqual([{ title: "Animals", cards: [{ front: "cat", back: "кошка" }] }]))
    await waitFor(() =>
      expect(testRouter.push).toHaveBeenCalledWith("/flashcards/set/?id=0000000c-0000-4000-8000-0000000000bb"),
    )
  })

  it("Create and practice opens the study screen", async () => {
    server.use(
      http.post(apiUrl("/v1/me/flashcard-sets"), () =>
        HttpResponse.json({ ...flashcardSetDetail, id: "0000000c-0000-4000-8000-0000000000bb" }),
      ),
    )
    const { user } = renderTools(<CardEditorPage />, { route: "/flashcards/edit/" })
    await user.type(screen.getByLabelText("Title"), "Animals")
    await user.type(rowFields(0).term, "cat")
    await user.type(rowFields(0).definition, "кошка")

    await user.click(createButton("Create and practice"))

    await waitFor(() =>
      expect(testRouter.push).toHaveBeenCalledWith("/flashcards/study/?id=0000000c-0000-4000-8000-0000000000bb"),
    )
  })

  it("adds pasted lines of term, tab, definition as cards", async () => {
    renderTools(<CardEditorPage />, { route: "/flashcards/edit/" })

    fireEvent.paste(rowFields(0).term, { clipboardData: { getData: () => "a\t1\nb\t2\nc\t3" } })

    await waitFor(() => expect(rowFields(2).term).toHaveValue("c"))
  })
})

describe("CardEditorPage, existing deck", () => {
  const route = `/flashcards/edit/?id=${ids.flashcardSet}`

  it("shows the saved cards", async () => {
    renderTools(<CardEditorPage />, { route })

    expect(await screen.findByLabelText("Title")).toHaveValue(flashcardSetDetail.title)
    expect(rowFields(0).term).toHaveValue(flashcardCards[0]?.front)
    expect(rowFields(1).definition).toHaveValue(flashcardCards[1]?.back)
  })

  it("saves the cards in the new order, with the ids of the saved ones, and returns to the overview", async () => {
    const puts: { cards: { id?: string; front: string; back: string }[] }[] = []
    server.use(
      http.put(apiUrl("/v1/me/flashcard-sets/:id/cards"), async ({ request }) => {
        puts.push((await readBody(request)) as (typeof puts)[number])
        return HttpResponse.json(flashcardSetDetail)
      }),
    )
    const { user } = renderTools(<CardEditorPage />, { route })
    await screen.findByLabelText("Title")
    rowFields(1).row.querySelector<HTMLElement>("[data-handle]")?.focus()
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}")

    await user.click(createButton("Save"))

    await waitFor(() => expect(puts).toHaveLength(1))
    expect(puts[0]?.cards.map((card) => card.id)).toEqual([
      flashcardCards[1]?.id,
      flashcardCards[0]?.id,
      ...flashcardCards.slice(2).map((card) => card.id),
    ])
    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith(`/flashcards/set/?id=${ids.flashcardSet}`))
  })

  it("changes the title first when it was edited", async () => {
    const patches: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/me/flashcard-sets/:id"), async ({ request }) => {
        patches.push(await readBody(request))
        return HttpResponse.json(flashcardSetDetail)
      }),
    )
    const { user } = renderTools(<CardEditorPage />, { route })
    const title = await screen.findByLabelText("Title")
    await user.clear(title)
    await user.type(title, "Renamed")

    await user.click(createButton("Save and practice"))

    await waitFor(() => expect(patches).toHaveLength(1))
    expect(patches[0]).toMatchObject({ title: "Renamed" })
    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith(`/flashcards/study/?id=${ids.flashcardSet}`))
  })
})
