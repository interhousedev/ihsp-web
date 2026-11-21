import { describe, expect, it } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { mockChooser, richInstitution } from "../../../tests/chooser-handlers"
import { renderAdmissionApp } from "../../../tests/helpers"
import { InstitutionDetail } from "./institution-detail"

describe("institution detail with rich details", () => {
  it("still shows scholarships, the AI summary and highlights next to the rich sections", async () => {
    const school = richInstitution({
      highlights: [{ key: "dorms", label: "Dormitories", value_text: "Guaranteed 4 years" }],
    })
    mockChooser()
    server.use(
      http.get(apiUrl("/v1/admission/universities/i2/chances"), () =>
        HttpResponse.json({ type: "about:blank", title: "Not found", status: 404 }, { status: 404 }),
      ),
      http.get(apiUrl("/v1/admission/outcomes/summary"), () =>
        HttpResponse.json({ type: "about:blank", title: "Not found", status: 404 }, { status: 404 }),
      ),
      http.get(apiUrl("/v1/admission/matches"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/catalog/institutions/i2"), () => HttpResponse.json(school)),
      http.get(apiUrl("/v1/admission/catalog/scholarships"), () =>
        HttpResponse.json([
          {
            id: "s1",
            name: "Founders Grant",
            basis: "merit",
            country: null,
            coverage_min: 50,
            coverage_max: 100,
            covers: ["tuition"],
            cycle: 2026,
            institution_id: "i2",
            provider: "Rich University",
            status: "open",
            url: null,
          },
        ]),
      ),
    )
    renderAdmissionApp(<InstitutionDetail />, { route: "/chooser/institution/?id=i2&tab=facts" })
    await screen.findByText("4-6%")
    expect(screen.getByText("Guaranteed 4 years")).toBeTruthy()
    fireEvent.click(await screen.findByRole("button", { name: "Ask AI" }))
    expect(await screen.findByRole("region", { name: "AI summary" })).toBeTruthy()
  })
})
