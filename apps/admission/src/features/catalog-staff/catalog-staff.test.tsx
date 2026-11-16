import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { CatalogStaffBody } from "./components/catalog-staff-page"
import { ProposeDialog } from "./components/propose-dialog"
import type { Proposal } from "./api"

const URL_PATH = "/v1/admission/staff/catalog/proposals"

const proposal: Proposal = {
  id: "p1",
  kind: "institution",
  target_id: null,
  fields: { name: "Test University", country: "GB" },
  source_url: "https://example.edu/admissions",
  note: null,
  status: "pending",
  proposed_by: "u1",
  created_at: "2026-01-01T00:00:00Z",
  reviewed_by: null,
  reviewed_at: null,
  review_note: null,
  applied_id: null,
  lock_version: 0,
}

describe("catalog staff", () => {
  test("a curator approves a pending proposal", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl(URL_PATH), () => HttpResponse.json({ items: [proposal], can_review: true })),
      http.post(apiUrl(`${URL_PATH}/p1/review`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...proposal, status: "approved", lock_version: 1 })
      }),
    )
    renderAdmissionApp(<CatalogStaffBody />)
    expect((await screen.findAllByText("Test University")).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole("button", { name: "Approve" }))
    await waitFor(() => expect(body).toEqual({ approve: true, lock_version: 0 }))
  })

  test("other staff see no review buttons", async () => {
    server.use(http.get(apiUrl(URL_PATH), () => HttpResponse.json({ items: [proposal], can_review: false })))
    renderAdmissionApp(<CatalogStaffBody />)
    expect((await screen.findAllByText("Test University")).length).toBeGreaterThan(0)
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull()
  })

  test("proposing sends the fields and the source", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(URL_PATH), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(proposal, { status: 201 })
      }),
    )
    renderAdmissionApp(<ProposeDialog open onOpenChange={() => {}} />)
    fireEvent.change(await screen.findByLabelText("Name"), { target: { value: "Test University" } })
    fireEvent.change(screen.getByLabelText("Country (2 letters)"), { target: { value: "gb" } })
    fireEvent.change(screen.getByLabelText("Source link (https)"), { target: { value: "https://example.edu/a" } })
    fireEvent.click(screen.getByRole("button", { name: "Send" }))
    await waitFor(() =>
      expect(body).toEqual({
        kind: "institution",
        target_id: null,
        fields: { name: "Test University", country: "GB" },
        source_url: "https://example.edu/a",
        note: null,
      }),
    )
  })
})
