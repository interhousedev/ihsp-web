import { describe, expect, it } from "bun:test"
import { apiUrl, ids, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, enter, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { FlashcardSetPage } from "./flashcard-set-page"

allowSlowRenders()

const route = `/flashcards/set/?id=${ids.flashcardSet}`

describe("FlashcardSetPage (UF-WEB-22, UF-WEB-25)", () => {
  it("shows the set with the learning, due and new counts and the actions", async () => {
    renderTools(<FlashcardSetPage />, { route })

    expect(await screen.findByRole("heading", { name: "Physics: kinematics" })).toBeInTheDocument()
    const counts = await screen.findByLabelText("Cards to study today")
    expect(within(counts).getByText("Learning").previousElementSibling).toHaveTextContent("1")
    expect(within(counts).getByText("Due").previousElementSibling).toHaveTextContent("1")
    expect(within(counts).getByText("New").previousElementSibling).toHaveTextContent("2")
    expect(screen.getByRole("link", { name: "Study" }).getAttribute("href")).toContain("/flashcards/study")
    expect(screen.getByRole("link", { name: "Edit" }).getAttribute("href")).toContain("/flashcards/edit")
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument()
    expect(screen.getByText("What is velocity?")).toBeInTheDocument()
  })

  it("saves the daily limits", async () => {
    let body: unknown
    server.use(
      http.patch(apiUrl(`/v1/me/flashcard-sets/${ids.flashcardSet}`), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({
          ...(await (await fetch(apiUrl(`/v1/me/flashcard-sets/${ids.flashcardSet}`))).json()),
          new_per_day: 5,
          reviews_per_day: 50,
        })
      }),
    )
    const { user } = renderTools(<FlashcardSetPage />, { route })
    const newPerDay = await screen.findByLabelText("New cards per day")

    await user.clear(newPerDay)
    await enter(user, newPerDay, "5")
    const reviews = screen.getByLabelText("Reviews per day")
    await user.clear(reviews)
    await enter(user, reviews, "50")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(body).toEqual({
        title: "Physics: kinematics",
        description: "Key definitions and formulas",
        new_per_day: 5,
        reviews_per_day: 50,
      }),
    )
  })

  it("does not accept a limit that is not a whole number", async () => {
    const { user } = renderTools(<FlashcardSetPage />, { route })
    const newPerDay = await screen.findByLabelText("New cards per day")

    await user.clear(newPerDay)
    await enter(user, newPerDay, "abc")

    expect(screen.getAllByText(/Enter a whole number from 0 to 9999/).length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
  })

  it("deletes the set after confirmation and returns to the list", async () => {
    let deleted = ""
    server.use(
      http.delete(apiUrl("/v1/me/flashcard-sets/:id"), ({ params }) => {
        deleted = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderTools(<FlashcardSetPage />, { route })

    await user.click(await screen.findByRole("button", { name: "Delete set" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete set" }))

    await waitFor(() => expect(deleted).toBe(ids.flashcardSet))
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/flashcards/"))
  })

  it("opens the share dialog without the chat options", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/shares"), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({
          id: "00000009-0000-4000-8000-0000000000bb",
          slug: "setslug1",
          kind: "flashcard_set",
          url: "http://localhost:3006/ai/setslug1",
          target_url: null,
          file: null,
          title: "Physics: kinematics",
          lesson_id: null,
          target_id: null,
          share_mode: null,
          hits: 0,
          created_at: "2026-10-07T05:12:00Z",
          expires_at: null,
          revoked_at: null,
          disabled: false,
        })
      }),
    )
    const { user } = renderTools(<FlashcardSetPage />, { route })

    await user.click(await screen.findByRole("button", { name: "Share" }))
    const dialog = await screen.findByRole("dialog")

    expect(within(dialog).queryByRole("switch")).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/personal data/)).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Create link" }))

    await waitFor(() => expect(body).toEqual({ kind: "flashcard_set", target_id: ids.flashcardSet }))
  })

  it("shows a message when the set does not exist", async () => {
    renderTools(<FlashcardSetPage />, { route: "/flashcards/set/?id=00000000-0000-4000-8000-000000000000" })

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})
