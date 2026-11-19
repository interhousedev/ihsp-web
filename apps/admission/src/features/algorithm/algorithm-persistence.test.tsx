import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { mockQuizzes } from "../../tests/quiz-handlers"
import { AlgorithmPage } from "./components/algorithm-page"

function setup(initial = {}) {
  const store = mockQuizzes(initial)
  let prefs: Record<string, unknown> = {}
  server.use(
    http.get(apiUrl("/v1/admission/preferences"), () =>
      HttpResponse.json({ answers: prefs, tags: [], updated_at: null }),
    ),
    http.put(apiUrl("/v1/admission/preferences"), async ({ request }) => {
      prefs = { ...prefs, ...((await request.json()) as object) }
      return HttpResponse.json({ answers: prefs, tags: [], updated_at: null })
    }),
    http.get(apiUrl("/v1/admission/career/majors"), () => HttpResponse.json({ items: [] })),
  )
  return store
}

describe("algorithm quiz persistence", () => {
  test("a multiple-choice answer is stored and shown again after a reload", async () => {
    const store = setup({
      algorithm: {
        answers: {
          experience: "social",
          setting: ["city"],
          region: [],
          small_classes: "true",
          ec_important: "true",
          food_important: "true",
        },
        completed: false,
      },
    })
    const first = renderAdmissionApp(<AlgorithmPage />)
    fireEvent.click(await screen.findByRole("checkbox", { name: /Research/ }))
    fireEvent.click(screen.getByRole("checkbox", { name: /Arts/ }))
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    await waitFor(() => expect(store.quizzes.algorithm.answers.traits).toEqual(["research", "arts"]))
    expect(store.quizzes.algorithm.completed).toBe(false)
    first.unmount()
    renderAdmissionApp(<AlgorithmPage />)
    // Resumes at the first unanswered question (the major), not at the start.
    await waitFor(() => expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "8"))
  })
})
