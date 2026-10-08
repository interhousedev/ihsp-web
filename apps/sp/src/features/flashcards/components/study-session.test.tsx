import { describe, expect, it } from "bun:test"
import { apiUrl, flashcardCards, flashcardSetDetail, ids, problem, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { StudySession } from "./study-session"

allowSlowRenders()

const route = `/flashcards/study/?id=${ids.flashcardSet}`

describe("StudySession (WEB-23, Anki's study screen)", () => {
  it("shows the question and the counts of the queue", async () => {
    renderTools(<StudySession />, { route })

    expect(await screen.findByText("What is velocity?")).toBeInTheDocument()
    expect(screen.getByTestId("study-counts")).toHaveTextContent("2+1+1")
    expect(screen.queryByText("The rate of change of position.")).not.toBeInTheDocument()
  })

  it("reveals the answer with Show answer and labels the buttons with the next intervals", async () => {
    const { user } = renderTools(<StudySession />, { route })

    await user.click(await screen.findByRole("button", { name: "Show answer" }))

    expect(screen.getByText("The rate of change of position.")).toBeInTheDocument()
    const labels = ["Again", "Hard", "Good", "Easy"].map((name) => {
      const button = screen.getByRole("button", { name })
      return document.getElementById(button.getAttribute("aria-describedby") ?? "")?.textContent
    })
    expect(labels).toEqual(["<10m", "1d", "3d", "7d"])
  })

  it("sends the rating with the time on screen and shows the next card", async () => {
    const bodies: { cardId: string; body: Record<string, unknown> }[] = []
    server.use(
      http.post(apiUrl("/v1/me/flashcards/:cardId/review"), async ({ params, request }) => {
        bodies.push({ cardId: String(params.cardId), body: (await readBody(request)) as Record<string, unknown> })
        return HttpResponse.json({
          set_id: ids.flashcardSet,
          card: {
            id: flashcardCards[1]?.id ?? "",
            front: "What is acceleration?",
            back: "The rate of change of velocity.",
            state: "learning",
          },
          intervals: { again: "10m", hard: "1d", medium: "3d", easy: "7d" },
          counts: { learning: 1, review: 0, new: 2 },
          done_for_today: false,
        })
      }),
    )
    const { user } = renderTools(<StudySession />, { route })
    await user.click(await screen.findByRole("button", { name: "Show answer" }))

    await user.click(screen.getByRole("button", { name: "Good" }))

    expect(await screen.findByText("What is acceleration?")).toBeInTheDocument()
    expect(bodies).toHaveLength(1)
    expect(bodies[0]?.cardId).toBe(flashcardCards[0]?.id)
    expect(bodies[0]?.body.rating).toBe("medium")
    expect(typeof bodies[0]?.body.duration_ms).toBe("number")
    expect(screen.queryByText("The rate of change of velocity.")).not.toBeInTheDocument()
  })

  it("answers with the keyboard: Space, then 1", async () => {
    const ratings: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/me/flashcards/:cardId/review"), async ({ request }) => {
        ratings.push(((await readBody(request)) as { rating: string }).rating)
        return HttpResponse.json({
          set_id: ids.flashcardSet,
          card: null,
          intervals: null,
          counts: { learning: 0, review: 0, new: 0 },
          done_for_today: true,
        })
      }),
    )
    const { user } = renderTools(<StudySession />, { route })
    await screen.findByText("What is velocity?")

    await user.keyboard(" ")
    await user.keyboard("1")

    await waitFor(() => expect(ratings).toEqual(["again"]))
  })

  it("congratulates when the deck is done and links back to the deck", async () => {
    server.use(
      http.get(apiUrl("/v1/me/flashcard-sets/:id/study"), () =>
        HttpResponse.json({
          set_id: ids.flashcardSet,
          card: null,
          intervals: null,
          counts: { learning: 0, review: 0, new: 0 },
          done_for_today: true,
        }),
      ),
    )
    renderTools(<StudySession />, { route })

    expect(await screen.findByText("Congratulations! You have finished this deck for now.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back to the deck" })).toHaveAttribute(
      "href",
      `/flashcards/set?id=${ids.flashcardSet}`,
    )
  })

  it("opens the editor from Edit and the options from Limits", async () => {
    const { user } = renderTools(<StudySession />, { route })

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    expect(testRouter.push).toHaveBeenCalledWith(`/flashcards/edit/?id=${ids.flashcardSet}`)

    await user.click(screen.getByRole("button", { name: "Limits" }))
    expect(testRouter.push).toHaveBeenCalledWith(`/flashcards/set/?id=${ids.flashcardSet}&options=1`)
  })

  it("shows the error of a failed rating and keeps the card", async () => {
    server.use(
      http.post(apiUrl("/v1/me/flashcards/:cardId/review"), () => problem(500, "internal-error", "Internal error")),
    )
    const { user } = renderTools(<StudySession />, { route })
    await user.click(await screen.findByRole("button", { name: "Show answer" }))

    await user.click(screen.getByRole("button", { name: "Easy" }))

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("What is velocity?")).toBeInTheDocument()
  })

  it("says so when no deck was chosen", () => {
    renderTools(<StudySession />, { route: "/flashcards/study/" })

    expect(screen.getByText("This deck was not found.")).toBeInTheDocument()
  })

  it("uses the title of the deck for the heading", async () => {
    renderTools(<StudySession />, { route })

    expect(await screen.findByRole("heading", { name: flashcardSetDetail.title })).toBeInTheDocument()
  })
})
