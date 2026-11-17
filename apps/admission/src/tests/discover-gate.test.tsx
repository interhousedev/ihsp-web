import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import Page from "../app/colleges/discover/page"
import { renderAdmissionApp } from "./helpers"
import { mockQuizzes } from "./quiz-handlers"

function other() {
  server.use(
    http.get(apiUrl("/v1/admission/preferences"), () => HttpResponse.json({ answers: {}, tags: [], updated_at: null })),
    http.get(apiUrl("/v1/admission/career/majors"), () => HttpResponse.json({ items: [] })),
  )
}

describe("discover gate", () => {
  test("shows the algorithm while its quiz is incomplete", async () => {
    mockQuizzes()
    other()
    renderAdmissionApp(<Page />)
    expect(await screen.findByRole("progressbar")).toBeInTheDocument()
  })
  test("does not show the algorithm once the quiz is complete", async () => {
    mockQuizzes({ algorithm: { answers: {}, completed: true } })
    other()
    renderAdmissionApp(<Page />)
    await new Promise((r) => setTimeout(r, 600))
    expect(screen.queryByRole("progressbar")).toBeNull()
  })
})
