import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { AdmissionConsentGate } from "./components/consent-gate"

const item = (kind: string, version: number) => ({
  app_scope: "admission",
  kind,
  version,
  previously_accepted_version: null,
  title: `Doc ${kind}`,
  body_markdown: "Body",
  announcement: null,
})

describe("AdmissionConsentGate", () => {
  test("slide stays locked until documents are ticked, then posts the acceptance", async () => {
    let body: unknown
    let items = [item("admission_terms", 2), item("admission_disclaimer", 1)]
    server.use(
      http.get(apiUrl("/v1/me/legal/pending"), () => HttpResponse.json({ items })),
      http.post(apiUrl("/v1/me/legal/accept"), async ({ request }) => {
        body = await request.json()
        items = []
        return HttpResponse.json({ items })
      }),
    )
    renderAdmissionApp(<AdmissionConsentGate />)
    const handle = await screen.findByRole("button", { name: /slide to agree/i })
    expect((handle as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole("checkbox", { name: /Doc admission_terms/ }))
    await waitFor(() => expect((handle as HTMLButtonElement).disabled).toBe(false))
    fireEvent.keyDown(handle, { key: "Enter" })
    await waitFor(() => expect(body).toBeDefined())
    expect(body).toEqual({
      items: [
        { kind: "admission_terms", version: 2, app_scope: "admission" },
        { kind: "admission_disclaimer", version: 1, app_scope: "admission" },
      ],
      guardian_attested: false,
    })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  test("gate shows again when a newer version is pending", async () => {
    let items = [item("admission_terms", 2)]
    server.use(
      http.get(apiUrl("/v1/me/legal/pending"), () => HttpResponse.json({ items })),
      http.post(apiUrl("/v1/me/legal/accept"), () => {
        items = [item("admission_terms", 3)]
        return HttpResponse.json({ items })
      }),
    )
    renderAdmissionApp(<AdmissionConsentGate />)
    fireEvent.click(await screen.findByRole("checkbox", { name: /Doc admission_terms/ }))
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    await screen.findByText(/updated|Doc admission_terms/)
    await waitFor(() =>
      expect(
        (screen.getByRole("checkbox", { name: /Doc admission_terms/ }) as HTMLElement).getAttribute("aria-checked"),
      ).toBe("false"),
    )
  })
})
