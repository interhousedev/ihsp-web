import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { institution, mockChooser } from "../../tests/chooser-handlers"
import { renderAdmissionApp } from "../../tests/helpers"
import { ProposeDialog } from "./components/propose-dialog"

const SPEC_PATH = "/v1/admission/staff/catalog/fact-spec"
const PROPOSALS = "/v1/admission/staff/catalog/proposals"

const SPEC = {
  groups: [
    {
      key: "admissions",
      label: "Admissions",
      facts: [
        {
          key: "acceptance_rate",
          kind: "int",
          label: "Acceptance rate",
          min: 0,
          max: 100,
          step: 1,
          unit: null,
          options: [],
          parts: [],
        },
      ],
    },
  ],
}

describe("catalog proposal regressions", () => {
  test("the fact spec is requested in the app locale", async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get(apiUrl(SPEC_PATH), ({ request }) => {
        seen.push(request.headers.get("Accept-Language"))
        return HttpResponse.json(SPEC)
      }),
    )
    renderAdmissionApp(<ProposeDialog open onOpenChange={() => {}} />, { locale: "uz" })
    await waitFor(() => expect(seen.length).toBeGreaterThan(0))
    expect(seen[0]).toBe("uz")
  })

  test("a name typed before choosing an existing school is not sent as a rename", async () => {
    let body: { target_id?: string; fields?: Record<string, unknown> } | null = null
    mockChooser({ items: [institution({ id: "i1", name: "Uni One" })] })
    server.use(
      http.get(apiUrl(SPEC_PATH), () => HttpResponse.json(SPEC)),
      http.post(apiUrl(PROPOSALS), async ({ request }) => {
        body = (await request.json()) as typeof body
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    renderAdmissionApp(<ProposeDialog open onOpenChange={() => {}} />)
    fireEvent.change(await screen.findByPlaceholderText("Edit an existing university (optional)"), {
      target: { value: "Harv" },
    })
    fireEvent.mouseDown(await screen.findByRole("option", { name: /Add "Harv"/ }))
    fireEvent.click(await screen.findByRole("button", { name: /New school/ }))
    fireEvent.change(await screen.findByPlaceholderText("Edit an existing university (optional)"), {
      target: { value: "Uni" },
    })
    fireEvent.mouseDown(await screen.findByRole("option", { name: /Uni One/ }))
    fireEvent.click(await screen.findByRole("button", { name: "Next" }))
    fireEvent.click(await screen.findByRole("button", { name: /Admissions/ }))
    fireEvent.change(await screen.findByLabelText("Acceptance rate"), { target: { value: "7" } })
    fireEvent.change(screen.getByLabelText("Acceptance rate: Source link (https)"), {
      target: { value: "https://example.edu/rate" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send" }))
    await waitFor(() => expect(body).not.toBeNull())
    expect(body!.target_id).toBe("i1")
    expect(Object.keys(body!.fields ?? {})).not.toContain("name")
  })
})
