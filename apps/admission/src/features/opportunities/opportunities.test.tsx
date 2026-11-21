import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { OpportunitiesStaffBody } from "../opportunities-staff/components/opportunities-staff-page"
import type { Opportunity, Plan, Submission, Taxonomy } from "./api"
import { ScholarshipsBody } from "./components/scholarships-page"
import { CatalogBody } from "./components/catalog-page"
import { ProgramsBody } from "./components/programs-tab"
import { PlanBody } from "./components/plan-page"

const BASE = "/v1/admission/opportunities"

const taxonomy: Taxonomy = {
  can_moderate: false,
  fields: [
    {
      id: "f1",
      name: { en: "STEM", ru: "STEM", uz: "STEM" },
      subfields: [{ id: "sf1", name: { en: "Mathematics" }, subjects: [{ id: "s1", name: { en: "Algebra" } }] }],
    },
  ],
}

const fields = {
  kind: "exam" as const,
  title: "SAT",
  summary: "College admission test",
  url: "https://example.org/sat",
  provider: "Board",
  subject_ids: ["s1"],
  grades: [11],
  registration_deadlines: ["2026-09-01"],
  exam_dates: ["2026-10-03"],
  last_year_dates: [],
  recurrence: null,
  lms_course_id: null,
  materials: [],
  online: false,
  essay_required: false,
}

const opportunity: Opportunity = {
  id: "o1",
  next_deadline: null,
  fields,
  archived: false,
  comment_count: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  for_you: false,
  delivery: "external",
  lock_version: 0,
  upcoming: [{ day: "2026-10-03", kind: "exam", projected: false }],
}

const plan: Plan = {
  entries: [
    {
      id: "e1",
      opportunity_id: "o1",
      planned_grade: 11,
      planned_term: "fall",
      note: null,
      created_at: "2026-01-01T00:00:00Z",
    },
  ],
  opportunities: [opportunity],
  analytics: { load: { "11:fall": 1 }, coverage: { f1: 1 }, unplaced: 0, conflicts: [] },
  deadlines: [{ opportunity_id: "o1", title: "SAT", day: "2026-10-03", kind: "exam", projected: false }],
}

const submission: Submission = {
  id: "sub1",
  target_id: null,
  fields,
  note: null,
  status: "pending",
  submitted_by: "u1",
  submitter_role: "student",
  created_at: "2026-01-01T00:00:00Z",
  reviewed_by: null,
  reviewed_at: null,
  reason: null,
  applied_id: null,
  lock_version: 0,
}

function common() {
  server.use(
    http.get(apiUrl(`${BASE}/taxonomy`), () => HttpResponse.json(taxonomy)),
    http.get(apiUrl("/v1/admission/orgs"), () => HttpResponse.json({ items: [], can_moderate: false })),
    http.get(apiUrl(BASE), () => HttpResponse.json({ items: [opportunity], total: 1, page: 1, size: 200 })),
    http.get(apiUrl(`${BASE}/plan`), () => HttpResponse.json({ ...plan, entries: [], opportunities: [] })),
  )
}

describe("opportunities", () => {
  test("saving an entry sends the planned grade", async () => {
    let body: unknown
    common()
    server.use(
      http.put(apiUrl(`${BASE}/plan/o1`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(plan.entries[0])
      }),
    )
    renderAdmissionApp(<CatalogBody />)
    expect((await screen.findAllByText("SAT")).length).toBeGreaterThan(0)
    fireEvent.click(await screen.findByRole("button", { name: /Save to plan/ }))
    await waitFor(() => expect(body).toMatchObject({ planned_grade: 11 }))
  })

  test("the plan shows analytics and the consent link on refusal", async () => {
    common()
    server.use(
      http.get(apiUrl(`${BASE}/plan`), () => HttpResponse.json(plan)),
      http.get(apiUrl(`${BASE}/plan/ai`), () => HttpResponse.json({ plan: null })),
      http.post(apiUrl(`${BASE}/plan/ai`), () =>
        HttpResponse.json(
          { type: "admission/consent_required", title: "Consent required", status: 403 },
          { status: 403, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<PlanBody />)
    expect(await screen.findByText("Your plan by grade and term")).toBeTruthy()
    fireEvent.click(await screen.findByRole("button", { name: /Build a plan/ }))
    expect(await screen.findByText("Open settings")).toBeTruthy()
  })

  test("a moderator approves a submission", async () => {
    let body: unknown
    common()
    server.use(
      http.get(apiUrl(`${BASE}/submissions`), () => HttpResponse.json({ items: [submission], can_moderate: true })),
      http.post(apiUrl(`/v1/admission/staff/opportunities/submissions/sub1/review`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...submission, status: "approved", lock_version: 1 })
      }),
    )
    renderAdmissionApp(<OpportunitiesStaffBody />)
    expect((await screen.findAllByText("SAT")).length).toBeGreaterThan(0)
    expect((screen.getByRole("button", { name: "Reject" }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Approve" }))
    await waitFor(() => expect(body).toEqual({ approve: true, reason: null, lock_version: 0 }))
  })

  test("non-moderators see no review buttons", async () => {
    common()
    server.use(
      http.get(apiUrl(`${BASE}/submissions`), () => HttpResponse.json({ items: [submission], can_moderate: false })),
    )
    renderAdmissionApp(<OpportunitiesStaffBody />)
    expect((await screen.findAllByText("SAT")).length).toBeGreaterThan(0)
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull()
  })

  test("programs render rows with fallbacks, paginate and add to the plan", async () => {
    const program = (id: string, title: string, extra: object) => ({
      ...opportunity,
      id,
      fields: { ...fields, kind: "program" as const, title, country: "USA", location: "Boston", ...extra },
    })
    const pages: string[] = []
    let added: unknown
    common()
    server.use(
      http.get(apiUrl(BASE), ({ request }) => {
        const page = new URL(request.url).searchParams.get("page") ?? "1"
        pages.push(page)
        const items =
          page === "1"
            ? [
                program("p1", "Lumiere", {
                  ranking: null,
                  tuition_usd: 0,
                  acceptance_rate: 5,
                  logo_url: "https://x.test/l.png",
                }),
                program("p2", "RSI", { ranking: 1, tuition_usd: 4000, acceptance_rate: null }),
              ]
            : [program("p3", "YYGS", { ranking: 3, tuition_usd: 100, acceptance_rate: 10 })]
        return HttpResponse.json({ items, total: 12, page: Number(page), size: 10 })
      }),
      http.put(apiUrl(`${BASE}/plan/p1`), async ({ request }) => {
        added = await request.json()
        return HttpResponse.json(plan.entries[0])
      }),
    )
    renderAdmissionApp(<ProgramsBody />)
    expect(await screen.findByText("Lumiere")).toBeTruthy()
    expect(screen.getByText("Free")).toBeTruthy()
    expect(screen.getByText("~5%")).toBeTruthy()
    expect(screen.getByText("#1")).toBeTruthy()
    expect(screen.getAllByText("—").length).toBeGreaterThan(0)
    expect(screen.getByText("Page 1 of 2")).toBeTruthy()
    fireEvent.click(screen.getAllByRole("button", { name: "+ Add" })[0])
    await waitFor(() => expect(added).toBeTruthy())
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(await screen.findByText("YYGS")).toBeTruthy()
    expect(screen.getByText("Page 2 of 2")).toBeTruthy()
    expect(pages).toContain("2")
  })

  test("scholarship filters have visible labels and an 'Any' option text", async () => {
    server.use(
      http.get(apiUrl(`${BASE}`), () => HttpResponse.json({ items: [], next_cursor: null })),
      http.get(apiUrl(`${BASE}/orgs`), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl(`${BASE}/plan`), () => HttpResponse.json({ ...plan, entries: [], opportunities: [] })),
    )
    renderAdmissionApp(<ScholarshipsBody />)
    for (const label of ["Scope", "Type", "Organization", "College credit"])
      expect(await screen.findByText(label)).toBeTruthy()
    expect(screen.getByText("Any scope")).toBeTruthy()
    expect(screen.getByText("Save scholarships with the heart to keep them here.")).toBeTruthy()
    expect(screen.queryByRole("heading", { level: 1, name: "Scholarships" })).toBeNull()
  })
})
