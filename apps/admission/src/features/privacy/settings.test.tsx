import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { AuditList } from "./components/audit-list"
import { PurposeConsents } from "./components/purpose-consents"

describe("privacy settings", () => {
  test("switch grants a purpose with PUT", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl("/v1/admission/consent/purposes"), () =>
        HttpResponse.json({
          items: ["admission_staff_view", "admission_ai", "admission_sharing", "admission_finance"].map((id) => ({
            id,
            title: { en: id === "admission_ai" ? "AI may process my data" : id },
            text: { en: id },
          })),
        }),
      ),
      http.get(apiUrl("/v1/admission/consent"), () => HttpResponse.json({ grants: [], non_ai_mode: false })),
      http.put(apiUrl("/v1/admission/consent"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ grants: [], non_ai_mode: false })
      }),
    )
    renderAdmissionApp(<PurposeConsents />)
    fireEvent.click(await screen.findByRole("switch", { name: /AI may process/ }))
    await waitFor(() => expect(body).toEqual({ purposes: ["admission_ai"] }))
  })

  test("audit list shows records and the empty state", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/privacy/audit"), () =>
        HttpResponse.json({
          items: [
            {
              at: "2026-01-02T10:00:00Z",
              actor_kind: "staff",
              action: "view",
              object_type: "profile",
              object_id: "1",
              staff_role_id: null,
            },
          ],
        }),
      ),
    )
    renderAdmissionApp(<AuditList />)
    expect(await screen.findByText(/staff · view · profile/)).toBeTruthy()
  })
})
