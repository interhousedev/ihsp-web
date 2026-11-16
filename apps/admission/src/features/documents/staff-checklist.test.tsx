import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { ChecklistItem } from "./api"
import { StaffChecklistTab } from "./components/staff-checklist-tab"

const item: ChecklistItem = {
  id: "c1",
  template_key: "shared.passport",
  title_key: "passport",
  list_entry_id: null,
  owner: "student",
  status: "todo",
  due_utc: null,
  document_id: null,
  source_url: null,
  important: false,
  urgent_override: null,
  app_path: null,
  urgent: false,
  quadrant: "drop",
}

function serve(items: ChecklistItem[]) {
  server.use(
    http.get(apiUrl("/v1/admission/checklist"), ({ request }) => {
      expect(new URL(request.url).searchParams.get("student_id")).toBe("s1")
      return HttpResponse.json(items)
    }),
  )
}

describe("staff checklist link", () => {
  test("rejects a non-http address before sending", async () => {
    serve([item])
    let called = false
    server.use(
      http.patch(apiUrl("/v1/admission/checklist/c1"), () => {
        called = true
        return HttpResponse.json(item)
      }),
    )
    const { user } = renderAdmissionApp(<StaffChecklistTab studentId="s1" />)
    await user.type(await screen.findByLabelText(/External link/), "javascript:alert(1)")
    await user.click(screen.getByRole("button", { name: "Save link" }))
    expect(await screen.findByText("Enter a valid https:// address.")).toBeTruthy()
    expect(called).toBe(false)
  })

  test("saves a valid link", async () => {
    serve([item])
    let body: unknown = null
    server.use(
      http.patch(apiUrl("/v1/admission/checklist/c1"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...item, source_url: "https://x.uz/p" })
      }),
    )
    const { user } = renderAdmissionApp(<StaffChecklistTab studentId="s1" />)
    await user.type(await screen.findByLabelText(/External link/), " https://x.uz/p ")
    await user.click(screen.getByRole("button", { name: "Save link" }))
    await screen.findByLabelText(/External link/)
    expect(body).toEqual({ source_url: "https://x.uz/p" })
  })

  test("shows the field error from invalid_proof_url", async () => {
    serve([item])
    server.use(
      http.patch(apiUrl("/v1/admission/checklist/c1"), () =>
        HttpResponse.json(
          { type: "admission/invalid_proof_url", title: "Invalid", status: 422 },
          { status: 422, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderAdmissionApp(<StaffChecklistTab studentId="s1" />)
    await user.type(await screen.findByLabelText(/External link/), "https://bad.example")
    await user.click(screen.getByRole("button", { name: "Save link" }))
    expect(await screen.findByText("Enter a valid https:// address.")).toBeTruthy()
  })

  test("clears an existing link with an empty value", async () => {
    serve([{ ...item, source_url: "https://x.uz/p" }])
    let body: unknown = null
    server.use(
      http.patch(apiUrl("/v1/admission/checklist/c1"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(item)
      }),
    )
    const { user } = renderAdmissionApp(<StaffChecklistTab studentId="s1" />)
    await screen.findByDisplayValue("https://x.uz/p")
    await user.click(screen.getByRole("button", { name: "Remove link" }))
    await screen.findByLabelText(/External link/)
    expect(body).toEqual({ source_url: null })
  })
})
