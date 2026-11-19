import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { SearchView } from "../features/chooser/components/search-view"
import { renderAdmissionApp } from "./helpers"
import { mockQuizzes } from "./quiz-handlers"

function other() {
  server.use(
    http.get(apiUrl("/v1/admission/preferences"), () => HttpResponse.json({ answers: {}, tags: [], updated_at: null })),
    http.get(apiUrl("/v1/admission/career/majors"), () => HttpResponse.json({ items: [] })),
  )
}

/** The algorithm sits inline only in the wide layout (from 1440px); narrower, it lives in a dialog. */
let width = 0
beforeEach(() => {
  width = window.innerWidth
  window.innerWidth = 1600
})
afterEach(() => {
  window.innerWidth = width
})

describe("discover gate", () => {
  test("shows the algorithm while its quiz is incomplete", async () => {
    mockQuizzes()
    other()
    renderAdmissionApp(<SearchView />, { route: "/chooser/search/?view=discover" })
    expect(await screen.findByRole("heading", { name: "Your Algorithm" })).toBeInTheDocument()
    expect(screen.getByText("Answer the questions to get your tags.")).toBeInTheDocument()
  })
  test("shows the swipe deck once the quiz is complete", async () => {
    mockQuizzes({ algorithm: { answers: {}, completed: true } })
    other()
    renderAdmissionApp(<SearchView />, { route: "/chooser/search/?view=discover" })
    expect(await screen.findByTestId("discover-side-slot")).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole("status").length).toBeGreaterThan(0))
  })
})
