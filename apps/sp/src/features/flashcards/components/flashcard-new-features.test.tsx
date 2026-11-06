import { describe, expect, it } from "bun:test"
import { apiUrl, flashcardSetDetail, ids, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { CardStatsList } from "./card-stats-list"
import { MergeSetsDialog } from "./merge-sets-dialog"
import { StudySession } from "./study-session"

allowSlowRenders()

const done = {
  set_id: ids.flashcardSet,
  card: null,
  intervals: null,
  counts: { learning: 0, review: 0, new: 0 },
  done_for_today: true,
  practice: false,
  practice_remaining: 0,
}

describe("flash card restart, merge and statistics", () => {
  it("restarts from the finished screen and says the schedule does not change", async () => {
    let restarted = 0
    server.use(
      http.get(apiUrl("/v1/me/flashcard-sets/:id/study"), () => HttpResponse.json(done)),
      http.post(apiUrl("/v1/me/flashcard-sets/:id/study/restart"), () => {
        restarted += 1
        return HttpResponse.json({
          ...done,
          card: { id: "c1", front: "Again?", back: "Yes", state: "review" },
          done_for_today: false,
          practice: true,
          practice_remaining: 3,
        })
      }),
    )
    const { user } = renderTools(<StudySession />, { route: `/flashcards/study/?id=${ids.flashcardSet}` })

    await user.click(await screen.findByRole("button", { name: "Study again" }))

    expect(await screen.findByText("Again?")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("3 cards")
    expect(restarted).toBe(1)
  })

  it("merges the selected decks under the new name", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/me/flashcard-sets/merge"), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({ set: flashcardSetDetail, duplicates_skipped: 1 })
      }),
    )
    const decks = [
      { ...flashcardSetDetail, id: "a", title: "Deck A" },
      { ...flashcardSetDetail, id: "b", title: "Deck B" },
    ]
    const { user } = renderTools(<MergeSetsDialog decks={decks} open onOpenChange={() => undefined} />)
    const submit = screen.getByRole("button", { name: "Combine" })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole("checkbox", { name: /Deck A/ }))
    await user.click(screen.getByRole("checkbox", { name: /Deck B/ }))
    await user.type(screen.getByLabelText("Name of the new deck"), "Both")
    await user.click(submit)

    await screen.findByRole("button", { name: "Combine" })
    expect(body).toEqual({ set_ids: ["a", "b"], title: "Both" })
  })

  it("shows the attempts of every question", async () => {
    server.use(
      http.get(apiUrl("/v1/me/flashcard-sets/:id/card-stats"), () =>
        HttpResponse.json([
          {
            card_id: "c1",
            front: "Velocity?",
            hardness: "hard",
            attempts: 3,
            correct: 2,
            incorrect: 1,
            last_studied_at: null,
          },
        ]),
      ),
    )
    renderTools(<CardStatsList setId={ids.flashcardSet} />)

    expect(await screen.findByText("Velocity?")).toBeInTheDocument()
    expect(screen.getByText(/Attempts: 3, correct: 2, incorrect: 1/)).toBeInTheDocument()
  })
})
