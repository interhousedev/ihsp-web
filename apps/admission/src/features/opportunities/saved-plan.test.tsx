import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { Opportunity, Plan } from "./api"
import { OpportunityDetailBody } from "./components/opportunity-detail-page"
import { PlanBody } from "./components/plan-page"

const BASE = "/v1/admission/opportunities"

const opportunity: Opportunity = {
  id: "o1",
  fields: {
    kind: "course",
    title: "Elements of AI",
    summary: "",
    url: null,
    provider: "Helsinki",
    subject_ids: [],
    grades: [10],
    registration_deadlines: [],
    exam_dates: [],
    last_year_dates: [],
    recurrence: null,
    lms_course_id: null,
    materials: [],
    online: true,
    essay_required: false,
  },
  archived: false,
  comment_count: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  for_you: false,
  lock_version: 0,
  upcoming: [{ day: "2026-10-03", kind: "registration", projected: false }],
} as Opportunity

const plan: Plan = {
  entries: [{ id: "e1", opportunity_id: "o1", planned_grade: 10, note: null, created_at: "2026-01-01T00:00:00Z" }],
  opportunities: [opportunity],
  analytics: { load: {}, coverage: {}, unplaced: 0, conflicts: [] },
  deadlines: [],
}

function routes() {
  server.use(
    http.get(apiUrl(`${BASE}/taxonomy`), () => HttpResponse.json({ can_moderate: false, fields: [] })),
    http.get(apiUrl(`${BASE}/plan`), () => HttpResponse.json(plan)),
    http.get(apiUrl(`${BASE}/plan/ai`), () => HttpResponse.json({ plan: null })),
    http.get(apiUrl(`${BASE}/o1`), () => HttpResponse.json({ ...opportunity, comments: [], can_moderate: false })),
  )
}

describe("saved plan", () => {
  test("ADM-SAVED-1: one H1 and no nested tab bars", async () => {
    routes()
    renderAdmissionApp(<PlanBody />, { route: "/plan/?view=saved" })
    expect(await screen.findByText("Elements of AI")).toBeTruthy()
    expect(screen.queryAllByRole("heading", { level: 1 }).length).toBe(0)
    expect(screen.queryByRole("tablist")).toBeNull()
  })

  test("ADM-SAVED-2: a saved card links to add to achievements; empty coverage is hidden", async () => {
    routes()
    renderAdmissionApp(<PlanBody />, { route: "/plan/?view=saved" })
    const link = await screen.findByRole("link", { name: /Add to achievements/ })
    expect(link.getAttribute("href")).toBe("/activities?item=new&from=e1")
    expect(screen.queryByText("Fields covered")).toBeNull()
  })

  test("ADM-SAVED-3: the detail page shows kind, dates and Open my plan once saved", async () => {
    routes()
    renderAdmissionApp(<OpportunityDetailBody />, { route: "/opportunities/view/?id=o1" })
    expect(await screen.findByRole("heading", { level: 1, name: "Elements of AI" })).toBeTruthy()
    expect(screen.getByText("Helsinki")).toBeTruthy()
    const link = await screen.findByRole("link", { name: "Open my plan" })
    expect(link.getAttribute("href")).toBe("/plan?view=saved")
  })
})
