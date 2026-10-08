import { describe, expect, it } from "bun:test"
import { apiUrl, flashcardSetDetail, ids, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { FlashcardSetPage } from "./flashcard-set-page"

allowSlowRenders()

const route = `/flashcards/set/?id=${ids.flashcardSet}`

describe("FlashcardSetPage (WEB-22, Anki's deck overview)", () => {
  it("shows the title, description and the New, Learning and To review counts", async () => {
    renderTools(<FlashcardSetPage />, { route })

    expect(await screen.findByRole("heading", { name: flashcardSetDetail.title })).toBeInTheDocument()
    expect(screen.getByText(flashcardSetDetail.description ?? "")).toBeInTheDocument()
    expect(screen.getByText("New:").nextElementSibling).toHaveTextContent("2")
    expect(screen.getByText("Learning:").nextElementSibling).toHaveTextContent("1")
    expect(screen.getByText("To review:").nextElementSibling).toHaveTextContent("1")
  })

  it("has a big Study now link and the heatmap of this deck", async () => {
    const statsRequests: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/me/flashcard-sets/stats"), ({ request }) => {
        statsRequests.push(new URL(request.url).searchParams.get("set_id"))
        return HttpResponse.json({
          year: 2026,
          set_id: ids.flashcardSet,
          days: [{ date: "2026-10-07", count: 4 }],
          total_reviews: 4,
          days_studied: 1,
          daily_average: 4,
          days_learned_percent: 100,
          longest_streak: 1,
          current_streak: 1,
          first_review_date: "2026-10-07",
          today_count: 4,
          today_seconds: 20,
        })
      }),
    )
    renderTools(<FlashcardSetPage />, { route })

    expect(await screen.findByRole("link", { name: "Study now" })).toHaveAttribute(
      "href",
      `/flashcards/study?id=${ids.flashcardSet}`,
    )
    expect(await screen.findByTestId("review-heatmap")).toBeInTheDocument()
    expect(statsRequests).toEqual([ids.flashcardSet])
  })

  it("goes to the editor with Edit cards", async () => {
    const { user } = renderTools(<FlashcardSetPage />, { route })

    await user.click(await screen.findByRole("button", { name: "Edit cards" }))

    expect(testRouter.push).toHaveBeenCalledWith(`/flashcards/edit/?id=${ids.flashcardSet}`)
  })

  it("saves the daily limits in the Options dialog", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/me/flashcard-sets/:id"), async ({ request }) => {
        bodies.push(await readBody(request))
        return HttpResponse.json(flashcardSetDetail)
      }),
    )
    const { user } = renderTools(<FlashcardSetPage />, { route })

    await user.click(await screen.findByRole("button", { name: "Options" }))
    const dialog = await screen.findByRole("dialog")
    const newPerDay = within(dialog).getByLabelText("New cards per day")
    await user.clear(newPerDay)
    await user.type(newPerDay, "15")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          title: flashcardSetDetail.title,
          description: flashcardSetDetail.description,
          new_per_day: 15,
          reviews_per_day: 100,
        },
      ]),
    )
  })

  it("refuses limits outside what the backend accepts", async () => {
    const { user } = renderTools(<FlashcardSetPage />, { route })

    await user.click(await screen.findByRole("button", { name: "Options" }))
    const dialog = await screen.findByRole("dialog")
    const newPerDay = within(dialog).getByLabelText("New cards per day")
    await user.clear(newPerDay)
    await user.type(newPerDay, "0")

    expect(within(dialog).getByText("Enter a whole number from 1 to 200.")).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled()
  })

  it("opens the Options dialog at once with ?options=1 (the gear of the deck list and Limits)", async () => {
    renderTools(<FlashcardSetPage />, { route: `${route}&options=1` })

    expect(await screen.findByRole("dialog", { name: `Options: ${flashcardSetDetail.title}` })).toBeInTheDocument()
  })

  it("edits the description", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/me/flashcard-sets/:id"), async ({ request }) => {
        bodies.push(await readBody(request))
        return HttpResponse.json(flashcardSetDetail)
      }),
    )
    const { user } = renderTools(<FlashcardSetPage />, { route })

    await user.click(await screen.findByRole("button", { name: "Description" }))
    const dialog = await screen.findByRole("dialog")
    const field = within(dialog).getByLabelText("Description")
    await user.clear(field)
    await user.type(field, "New text")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(bodies).toEqual([{ description: "New text" }]))
  })

  it("deletes the deck from the Options dialog after confirmation", async () => {
    const deleted: string[] = []
    server.use(
      http.delete(apiUrl("/v1/me/flashcard-sets/:id"), ({ params }) => {
        deleted.push(String(params.id))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderTools(<FlashcardSetPage />, { route })

    await user.click(await screen.findByRole("button", { name: "Options" }))
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete deck" }))
    const confirm = await screen.findByRole("alertdialog")
    await user.click(within(confirm).getByRole("button", { name: "Delete deck" }))

    await waitFor(() => expect(deleted).toEqual([ids.flashcardSet]))
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/flashcards/"))
  })

  it("says so when no deck was chosen", () => {
    renderTools(<FlashcardSetPage />, { route: "/flashcards/set/" })

    expect(screen.getByText("This deck was not found.")).toBeInTheDocument()
  })
})
