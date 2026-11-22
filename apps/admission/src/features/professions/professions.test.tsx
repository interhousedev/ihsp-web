import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { mockChooser } from "../../tests/chooser-handlers"
import { ProfessionsPage } from "./components/professions-page"

const profession = (id: string, name: string, ai_risk: "low" | "medium" | "high") => ({
  id,
  name,
  group: "Professionals",
  ai_exposure: 0.42,
  ai_risk,
  horizon: "5y",
  salary_band: "high",
  related_fields: [],
  sources: [{ label: "ILO 2025", url: "https://example.org/ilo" }],
})

describe("professions page", () => {
  test("adds a profession, saves the ranking, shows risk with the honest note", async () => {
    mockChooser()
    const puts: unknown[] = []
    server.use(
      http.get(apiUrl("/v1/admission/professions"), () =>
        HttpResponse.json({ items: [profession("2512", "Software developer", "medium")] }),
      ),
      http.get(apiUrl("/v1/admission/me/professions"), () => HttpResponse.json({ items: [] })),
      http.put(apiUrl("/v1/admission/me/professions"), async ({ request }) => {
        const body = (await request.json()) as { items: { profession_id: string; rank: number }[] }
        puts.push(body)
        return HttpResponse.json({ items: [{ ...profession("2512", "Software developer", "medium"), rank: 1 }] })
      }),
      http.get(apiUrl("/v1/admission/me/ikigai"), () =>
        HttpResponse.json({ love: [], good_at: [], needs: [], paid: [] }),
      ),
      http.get(apiUrl("/v1/admission/list/fit"), () => HttpResponse.json({ weights: {}, items: [] })),
      http.get(apiUrl("/v1/admission/career"), () => HttpResponse.json({ study_focus: { labels: [] } })),
      http.get(apiUrl("/v1/admission/me/quizzes/career"), () => HttpResponse.json({ answers: {}, completed: false })),
    )
    renderAdmissionApp(<ProfessionsPage />)
    expect(await screen.findByText("Software developer")).toBeInTheDocument()
    expect(screen.getAllByText(/not a forecast of layoffs/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Medium AI exposure/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Add Software developer/ }))
    await waitFor(() => expect(puts).toEqual([{ items: [{ profession_id: "2512", rank: 1 }] }]))
  })
})
