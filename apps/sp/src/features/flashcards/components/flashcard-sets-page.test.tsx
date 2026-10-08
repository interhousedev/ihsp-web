import { describe, expect, it } from "bun:test"
import { apiUrl, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, enter, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { FlashcardSetsPage } from "./flashcard-sets-page"

allowSlowRenders()

describe("FlashcardSetsPage (WEB-22)", () => {
  it("lists the sets with their due, new and card counts", async () => {
    renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })

    const physics = (await screen.findByRole("heading", { name: "Physics: kinematics" })).closest("li") as HTMLElement
    expect(within(physics).getByText("Due").nextElementSibling).toHaveTextContent("2")
    expect(within(physics).getByText("New").nextElementSibling).toHaveTextContent("2")
    expect(within(physics).getByText("Cards").nextElementSibling).toHaveTextContent("4")
    expect(within(physics).getByRole("link", { name: "Study" }).getAttribute("href")).toContain("/flashcards/study")

    const english = screen.getByRole("heading", { name: "English: irregular verbs" }).closest("li") as HTMLElement
    expect(within(english).getByText("Assistant")).toBeInTheDocument()
  })

  it("creates an empty set and opens the card editor", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/me/flashcard-sets"), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({
          id: "0000000c-0000-4000-8000-0000000000aa",
          title: "Chemistry",
          description: null,
          source: "manual",
          card_count: 0,
          due_today: 0,
          new_today: 0,
          new_per_day: 20,
          reviews_per_day: 200,
          cards: [],
        })
      }),
    )
    const { user } = renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })

    await user.click((await screen.findAllByRole("button", { name: "New set" }))[0] as HTMLElement)
    const dialog = await screen.findByRole("dialog")
    await enter(user, within(dialog).getByLabelText("Title"), "Chemistry")
    await user.click(within(dialog).getByRole("button", { name: "Create set" }))

    await waitFor(() => expect(body).toEqual({ title: "Chemistry", cards: [] }))
    await waitFor(() =>
      expect(testRouter.push).toHaveBeenCalledWith("/flashcards/edit/?id=0000000c-0000-4000-8000-0000000000aa"),
    )
  })

  it("does not create a set without a title", async () => {
    const { user } = renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })

    await user.click((await screen.findAllByRole("button", { name: "New set" }))[0] as HTMLElement)

    expect(within(await screen.findByRole("dialog")).getByRole("button", { name: "Create set" })).toBeDisabled()
  })

  it("shows an empty state with the New set button", async () => {
    server.use(http.get(apiUrl("/v1/me/flashcard-sets"), () => HttpResponse.json([])))
    renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })

    expect(await screen.findByText(/No sets yet/)).toBeInTheDocument()
  })

  it("shows an error with a retry", async () => {
    server.use(http.get(apiUrl("/v1/me/flashcard-sets"), () => HttpResponse.error()))
    renderTools(<FlashcardSetsPage />, { route: "/flashcards/" })

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})
