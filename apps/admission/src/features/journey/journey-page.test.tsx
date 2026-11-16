import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { JourneyHero } from "./journey-hero"

const settle = () => new Promise((resolve) => setTimeout(resolve, 300))

describe("journey hero", () => {
  test("shows the current act, progress and a resume link from the API data", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/readiness"), () =>
        HttpResponse.json({
          percent: 10,
          components: [{ key: "major", score: 100, weight: 10, next_action: null, url_path: null }],
        }),
      ),
      http.get(apiUrl("/v1/admission/preferences"), () =>
        HttpResponse.json({ answers: {}, tags: [], completed: true, updated_at: null }),
      ),
    )
    renderAdmissionApp(<JourneyHero />)
    expect(await screen.findByText("Decide what to study and where")).toBeTruthy()
    await settle()
    expect(screen.getByText("2 of 10 milestones")).toBeTruthy()
    expect(screen.getByRole("link", { name: /Resume journey/ }).getAttribute("href")).toMatch(/^\/setup\/?$/)
    await settle()
  })
})
