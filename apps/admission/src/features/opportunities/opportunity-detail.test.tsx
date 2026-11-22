import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { OpportunityReportsBody } from "../opportunities-staff/components/reports-page"
import { OpportunityDetailBody } from "./components/opportunity-detail-page"

const BASE = "/v1/admission"

const comment = {
  id: "c1",
  opportunity_id: "o1",
  author_id: "00000000-0000-4000-8000-0000000000aa",
  author_name: "Dilnoza",
  body: "Great scholarship",
  status: "visible",
  created_at: "2026-01-02T00:00:00Z",
}

function detail(extra: Record<string, unknown> = {}) {
  return {
    id: "o1",
    archived: false,
    comment_count: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    lock_version: 0,
    upcoming: [],
    org: { id: "org1", name: "Lumiere Foundation", kind: "foundation", logo_url: null },
    fields: {
      kind: "scholarship",
      title: "Lumiere Scholarship",
      summary: "Full ride",
      subject_ids: [],
      grades: [11],
      registration_deadlines: ["2026-12-01"],
      exam_dates: [],
      last_year_dates: [],
      award_type: "scholarship",
      scope: "international",
      coverage: ["full_tuition"],
      amount_text: "$20,000",
      essay_required: true,
      eligibility: "Grade 11 students",
      college_credit: "none",
      source_url: "https://example.org/apply",
    },
    comments: [comment],
    can_moderate: false,
    ...extra,
  }
}

function routes(item = detail()) {
  server.use(
    http.get(apiUrl(`${BASE}/opportunities/o1`), () => HttpResponse.json(item)),
    http.get(apiUrl(`${BASE}/opportunities/plan`), () =>
      HttpResponse.json({
        entries: [],
        opportunities: [],
        analytics: { load: {}, coverage: {}, unplaced: 0, conflicts: [] },
        deadlines: [],
      }),
    ),
  )
}

describe("opportunity detail", () => {
  test("shows the facts of a scholarship", async () => {
    routes()
    renderAdmissionApp(<OpportunityDetailBody />, { route: "/opportunities/view/?id=o1" })
    expect(await screen.findByText("Lumiere Scholarship")).toBeTruthy()
    expect(screen.getByText("$20,000")).toBeTruthy()
    expect(screen.getByText("Grade 11 students")).toBeTruthy()
    expect(screen.getByText("Great scholarship")).toBeTruthy()
  })

  test("a scholarship links back to its kind tab and shows one Scholarship pill", async () => {
    routes()
    renderAdmissionApp(<OpportunityDetailBody />, { route: "/opportunities/view/?id=o1" })
    expect(await screen.findByText("Lumiere Scholarship")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Scholarships" }).getAttribute("href")).toBe(
      "/opportunities?kind=scholarship",
    )
    expect(screen.getAllByText("Scholarship")).toHaveLength(1)
  })

  test("posts a comment", async () => {
    let body: unknown
    routes()
    server.use(
      http.post(apiUrl(`${BASE}/opportunities/o1/comments`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...comment, id: "c2", body: "Thanks" }, { status: 201 })
      }),
    )
    renderAdmissionApp(<OpportunityDetailBody />, { route: "/opportunities/view/?id=o1" })
    fireEvent.change(await screen.findByLabelText("Your comment"), { target: { value: "Thanks" } })
    fireEvent.click(screen.getByRole("button", { name: "Post" }))
    await waitFor(() => expect(body).toEqual({ body: "Thanks" }))
  })

  test("reports another user's comment with a reason", async () => {
    let body: unknown
    routes()
    server.use(
      http.post(apiUrl(`${BASE}/opportunity-comments/c1/report`), async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<OpportunityDetailBody />, { route: "/opportunities/view/?id=o1" })
    fireEvent.click(await screen.findByRole("button", { name: "Report" }))
    const send = screen.getByRole("button", { name: "Send report" }) as HTMLButtonElement
    expect(send.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Spam" } })
    fireEvent.click(send)
    await waitFor(() => expect(body).toEqual({ reason: "Spam" }))
  })

  test("a moderator hides a comment", async () => {
    let hit = false
    routes(detail({ can_moderate: true }))
    server.use(
      http.post(apiUrl(`${BASE}/staff/opportunity-comments/c1/hide`), () => {
        hit = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<OpportunityDetailBody />, { route: "/opportunities/view/?id=o1" })
    fireEvent.click(await screen.findByRole("button", { name: "Hide" }))
    await waitFor(() => expect(hit).toBe(true))
  })
})

describe("comment reports queue", () => {
  test("dismisses a report", async () => {
    let hit = false
    server.use(
      http.get(apiUrl(`${BASE}/staff/opportunities/reports`), () =>
        HttpResponse.json({
          items: [
            {
              id: "r1",
              comment,
              reporter_id: "u2",
              reporter_name: "Aziz",
              reason: "Spam",
              created_at: "2026-01-03T00:00:00Z",
            },
          ],
        }),
      ),
      http.post(apiUrl(`${BASE}/staff/opportunities/reports/r1/dismiss`), () => {
        hit = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<OpportunityReportsBody />)
    expect(await screen.findByText("Great scholarship")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    await waitFor(() => expect(hit).toBe(true))
  })
})
