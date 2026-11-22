import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { describe, expect, spyOn, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { OrgsEditor } from "../opportunities-staff/components/orgs-editor"
import { OpportunityReportsBody } from "../opportunities-staff/components/reports-page"
import { CatalogBody } from "./components/catalog-page"

const BASE = "/v1/admission"
const org = {
  id: "org1",
  name: "Lumiere Foundation",
  kind: "foundation",
  logo_url: "https://example.org/l.png",
  website: null,
  country: null,
}
const scholarship = {
  id: "s1",
  archived: false,
  comment_count: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  lock_version: 0,
  upcoming: [{ day: "2026-11-17", kind: "registration", projected: false }],
  org,
  fields: {
    kind: "scholarship",
    title: "Lumiere Scholarship",
    subject_ids: [],
    grades: [11],
    registration_deadlines: [],
    exam_dates: [],
    last_year_dates: [],
    award_type: "scholarship",
    amount_text: "$5,000",
    essay_required: true,
  },
}

describe("scholarships", () => {
  test("the carousel lists saved scholarships next to the full list", async () => {
    server.use(
      http.get(apiUrl(`${BASE}/orgs`), () => HttpResponse.json({ items: [org], can_moderate: false })),
      http.get(apiUrl(`${BASE}/opportunities`), () =>
        HttpResponse.json({ items: [scholarship], total: 1, page: 1, size: 200 }),
      ),
      http.get(apiUrl(`${BASE}/opportunities/plan`), () =>
        HttpResponse.json({
          entries: [
            { id: "e1", opportunity_id: "s1", planned_grade: 11, note: null, created_at: "2026-01-01T00:00:00Z" },
          ],
          opportunities: [scholarship],
          analytics: { load: {}, coverage: {}, unplaced: 0, conflicts: [] },
          deadlines: [],
        }),
      ),
    )
    renderAdmissionApp(<CatalogBody />, { route: "/opportunities/?kind=scholarship" })
    expect(await screen.findByRole("list", { name: "Your scholarships" })).toBeTruthy()
    expect((await screen.findAllByText("Lumiere Scholarship")).length).toBe(2)
    expect(screen.getAllByText("Essay req.").length).toBe(2)
    expect(screen.getAllByText("$5,000").length).toBe(2)
  })
})

describe("orgs editor", () => {
  test("creates an org", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl(`${BASE}/orgs`), () => HttpResponse.json({ items: [], can_moderate: true })),
      http.post(apiUrl(`${BASE}/staff/orgs`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(org, { status: 201 })
      }),
    )
    renderAdmissionApp(<OrgsEditor />)
    fireEvent.change(await screen.findByLabelText("Name"), { target: { value: "Lumiere Foundation" } })
    fireEvent.click(screen.getByRole("button", { name: "Add organization" }))
    await waitFor(() => expect(body).toMatchObject({ name: "Lumiere Foundation", kind: "university" }))
  })

  test("edits an org", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl(`${BASE}/orgs`), () => HttpResponse.json({ items: [org], can_moderate: true })),
      http.patch(apiUrl(`${BASE}/staff/orgs/org1`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(org)
      }),
    )
    renderAdmissionApp(<OrgsEditor />)
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Lumiere Fund" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(body).toMatchObject({ name: "Lumiere Fund" }))
  })

  test("deleting an org in use shows the 409 message", async () => {
    const error = spyOn(toast, "error")
    server.use(
      http.get(apiUrl(`${BASE}/orgs`), () => HttpResponse.json({ items: [org], can_moderate: true })),
      http.delete(apiUrl(`${BASE}/staff/orgs/org1`), () =>
        HttpResponse.json(
          { type: "admission/org_in_use", title: "In use", status: 409 },
          { status: 409, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<OrgsEditor />)
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }))
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("This organization is used by opportunities and cannot be deleted."),
    )
  })
})

describe("report queue", () => {
  test("hides the reported comment, then dismisses the report", async () => {
    const calls: string[] = []
    server.use(
      http.get(apiUrl(`${BASE}/staff/opportunities/reports`), () =>
        HttpResponse.json({
          items: [
            {
              id: "r1",
              comment: {
                id: "c1",
                opportunity_id: "s1",
                author_id: "u9",
                author_name: "Dilnoza",
                body: "Spam link",
                status: "published",
                created_at: "2026-01-02T00:00:00Z",
              },
              reporter_id: "u2",
              reporter_name: "Aziz",
              reason: "Spam",
              created_at: "2026-01-03T00:00:00Z",
            },
          ],
        }),
      ),
      http.post(apiUrl(`${BASE}/staff/opportunity-comments/c1/hide`), () => {
        calls.push("hide")
        return new HttpResponse(null, { status: 204 })
      }),
      http.post(apiUrl(`${BASE}/staff/opportunities/reports/r1/dismiss`), () => {
        calls.push("dismiss")
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<OpportunityReportsBody />)
    fireEvent.click(await screen.findByRole("button", { name: "Hide comment" }))
    await waitFor(() => expect(calls).toEqual(["hide", "dismiss"]))
  })
})
