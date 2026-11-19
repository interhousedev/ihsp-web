import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { EssayReviewPanel } from "./essay-review-panel"

const A = "/v1/admission"
const MESSAGES = {
  essayReview: {
    title: "Essay review",
    pick: "Universities (up to {max})",
    emptyList: "Your list is empty",
    run: "Review",
    running: "Reviewing…",
    refresh: "Refresh",
    stale: "Outdated",
    quota: "You have used all reviews for this week.",
    base: { title: "Essay review", criteria: "Criteria", strengths: "Strengths", improvements: "Improvements" },
    uni: {
      alignment: "Alignment {score}",
      emphasise: "What to emphasise",
      edits: "Specific edits",
      risks: "Risks",
      level: { strong: "strong", partial: "partial", missing: "missing" },
    },
  },
}

const entry = (id: string, name: string) => ({ id: `e-${id}`, institution: { id, name } })
const uni = (id: string, name: string) => ({
  institution_id: id,
  name,
  cached: false,
  stale: false,
  review: {
    alignment: 70,
    fit_summary: `Fit ${name}`,
    goals: [],
    risks: [],
    supplement_tips: [`Edit for ${name}`],
    sourced: true,
  },
})
const reviews = {
  base: {
    summary: "Solid essay",
    score: 80,
    band: "strong",
    dimensions: [{ key: "hook", score: 4, comment: "Good hook", quote: null }],
    strengths: ["Voice"],
    improvements: ["Cut the middle"],
  },
  base_cached: false,
  base_stale: false,
  universities: [uni("u1", "Alpha U"), uni("u2", "Beta U")],
}

function setup() {
  server.use(
    http.get(apiUrl(`${A}/list`), () => HttpResponse.json([entry("u1", "Alpha U"), entry("u2", "Beta U")])),
    http.get(apiUrl(`${A}/essays/e1/reviews`), () => HttpResponse.json({ ...reviews, base: null, universities: [] })),
  )
}

describe("EssayReviewPanel", () => {
  test("two universities give one base review and two tabs", async () => {
    setup()
    let body: unknown
    server.use(
      http.post(apiUrl(`${A}/essays/e1/reviews`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(reviews)
      }),
    )
    renderAdmissionApp(<EssayReviewPanel essayId="e1" />, { messages: MESSAGES })
    fireEvent.click(await screen.findByRole("checkbox", { name: "Alpha U" }))
    fireEvent.click(screen.getByRole("checkbox", { name: "Beta U" }))
    fireEvent.click(screen.getByRole("button", { name: "Review" }))
    await screen.findByTestId("base-review")
    expect(screen.getAllByTestId("base-review")).toHaveLength(1)
    expect(body).toEqual({ institution_ids: ["u1", "u2"], refresh: false })
    const tabs = within(screen.getByTestId("uni-reviews")).getAllByRole("tab")
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Alpha U", "Beta U"])
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument()
  })

  test("a spent quota shows its message", async () => {
    setup()
    server.use(
      http.post(apiUrl(`${A}/essays/e1/reviews`), () =>
        HttpResponse.json({ type: "admission/quota_exceeded", title: "Quota", status: 429 }, { status: 429 }),
      ),
    )
    renderAdmissionApp(<EssayReviewPanel essayId="e1" entryInstitutionIds={["u1"]} />, { messages: MESSAGES })
    fireEvent.click(await screen.findByRole("button", { name: "Review" }))
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("used all reviews"))
  })
})
