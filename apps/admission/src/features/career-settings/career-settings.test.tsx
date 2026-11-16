import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { CareerSettingsBody } from "./career-settings-page"

const BASE = "/v1/admission/career/admin"
const question = { id: "q1", section: "interests", prompt: { en: "Building things" }, sort_order: 1, active: true }
const major = {
  id: "m1",
  code: "cs",
  area: "stem",
  name: { en: "Computer science" },
  minor_ok: true,
  sort_order: 0,
  active: false,
}

describe("career settings", () => {
  test("lists questions and majors and saves an edited question through PUT", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl(`${BASE}/questions`), () => HttpResponse.json({ items: [question] })),
      http.get(apiUrl(`${BASE}/majors`), () => HttpResponse.json({ items: [major] })),
      http.put(apiUrl(`${BASE}/questions/q1`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(question)
      }),
    )
    renderAdmissionApp(<CareerSettingsBody />)
    expect(await screen.findByText("Computer science")).toBeTruthy()
    expect(screen.getByText("Inactive")).toBeTruthy()
    fireEvent.click((await screen.findAllByRole("button", { name: "Edit" }))[0]!)
    fireEvent.change(await screen.findByLabelText("Question (en)"), { target: { value: "Making things" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() =>
      expect(body).toMatchObject({ section: "interests", prompt: { en: "Making things" }, active: true }),
    )
  })
})
