import { describe, expect, it } from "bun:test"
import {
  apiUrl,
  flashcardCards,
  ids,
  studyDone,
  studyNext,
  studyNextSecond,
  server,
  testRouter,
} from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { StudySession } from "./study-session"

allowSlowRenders()

const route = `/flashcards/study/?id=${ids.flashcardSet}`

function recordReviews() {
  const reviews: { cardId: string; body: unknown }[] = []
  // Alternate between two cards so every review brings a different card, as the backend does.
  server.use(
    http.post(apiUrl("/v1/me/flashcards/:cardId/review"), async ({ params, request }) => {
      reviews.push({ cardId: String(params.cardId), body: await readBody(request) })
      return HttpResponse.json(reviews.length % 2 === 1 ? studyNextSecond : studyNext)
    }),
  )
  return reviews
}

describe("StudySession (UF-WEB-22, WEB-23)", () => {
  it("shows the front first and the answer after Show answer", async () => {
    const { user } = renderTools(<StudySession />, { route })

    expect(await screen.findByText("What is velocity?")).toBeInTheDocument()
    expect(screen.queryByText("The rate of change of position.")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Show answer (Space)" }))

    expect(screen.getByText("The rate of change of position.")).toBeInTheDocument()
  })

  it("reveals the answer on Space and rates the card with keys 1 to 4", async () => {
    const reviews = recordReviews()
    const { user } = renderTools(<StudySession />, { route })
    await screen.findByText("What is velocity?")

    for (const key of ["1", "2", "3", "4"]) {
      await user.keyboard(" ")
      await user.keyboard(key)
      await waitFor(() => expect(reviews).toHaveLength(Number(key)))
      // The next card is shown with its answer hidden again.
      await waitFor(() => expect(screen.queryByTestId("card-back")).not.toBeInTheDocument())
    }

    expect(reviews.map((review) => review.body)).toEqual([
      { rating: "again" },
      { rating: "hard" },
      { rating: "medium" },
      { rating: "easy" },
    ])
    expect(reviews[0]?.cardId).toBe(flashcardCards[0]?.id ?? "")
  })

  it("ignores rating keys before the answer is shown", async () => {
    const reviews = recordReviews()
    const { user } = renderTools(<StudySession />, { route })
    await screen.findByText("What is velocity?")

    await user.keyboard("3")

    expect(reviews).toHaveLength(0)
    expect(screen.queryByTestId("card-back")).not.toBeInTheDocument()
  })

  it("shows the next interval on each rating button", async () => {
    const { user } = renderTools(<StudySession />, { route })
    await screen.findByText("What is velocity?")

    await user.keyboard(" ")

    const group = screen.getByRole("group", { name: "How well did you know it?" })
    expect(group).toHaveTextContent("Again")
    expect(group).toHaveTextContent("10m")
    expect(group).toHaveTextContent("1d")
    expect(group).toHaveTextContent("3d")
    expect(group).toHaveTextContent("7d")
  })

  it("rates with the buttons too and finishes with a summary", async () => {
    server.use(http.post(apiUrl("/v1/me/flashcards/:cardId/review"), () => HttpResponse.json(studyDone)))
    const { user } = renderTools(<StudySession />, { route })
    await screen.findByText("What is velocity?")

    await user.keyboard(" ")
    await user.click(screen.getByRole("button", { name: /Medium/ }))

    expect(await screen.findByRole("heading", { name: "Done for today" })).toBeInTheDocument()
    expect(screen.getByText("You reviewed 1 card.")).toBeInTheDocument()
    expect(screen.getByText(/raise the daily limits/)).toBeInTheDocument()
    for (const link of screen.getAllByRole("link", { name: "Back to the set" })) {
      expect(link.getAttribute("href")).toContain(`id=${ids.flashcardSet}`)
    }
  })

  it("shows the summary right away when nothing is due", async () => {
    server.use(http.get(apiUrl(`/v1/me/flashcard-sets/${ids.flashcardSet}/study`), () => HttpResponse.json(studyDone)))
    renderTools(<StudySession />, { route })

    expect(await screen.findByRole("heading", { name: "Done for today" })).toBeInTheDocument()
    expect(testRouter.push).not.toHaveBeenCalled()
  })

  it("shows an error with a retry when the session cannot be loaded", async () => {
    server.use(http.get(apiUrl(`/v1/me/flashcard-sets/${ids.flashcardSet}/study`), () => HttpResponse.error()))
    renderTools(<StudySession />, { route })

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})
