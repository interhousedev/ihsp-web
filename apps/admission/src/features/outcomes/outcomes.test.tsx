import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { OutcomesPage } from "./components/outcomes-page"

const MIT = "11111111-1111-4111-8111-111111111111"

function serve(post: () => Response) {
  const posted: unknown[] = []
  server.use(
    http.get(apiUrl("/v1/admission/outcomes/summary"), () =>
      HttpResponse.json({
        items: [
          {
            institution_id: MIT,
            institution_name: "MIT",
            cycle: 2027,
            applied: 5,
            accepted: 1,
            by_status: { accepted: 1, rejected: 4 },
            names: [{ name: "Aziza", status: "accepted", plan: "ea", shared: true }],
          },
        ],
        applied: 5,
        accepted: 1,
      }),
    ),
    http.get(apiUrl("/v1/admission/outcomes"), () => HttpResponse.json({ items: [] })),
    http.get(apiUrl("/v1/admission/catalog/institutions"), () =>
      HttpResponse.json({ items: [{ id: MIT, name: "MIT", country: "US" }] }),
    ),
    http.post(apiUrl("/v1/admission/outcomes"), async ({ request }) => {
      posted.push(await request.json())
      return post()
    }),
  )
  return posted
}

async function fillAndSave() {
  const user = userEvent.setup()
  await user.click((await screen.findAllByRole("button", { name: "Add a result" }))[0]!)
  await user.type(await screen.findByLabelText("Search a university"), "mit")
  await user.click(await screen.findByRole("button", { name: "MIT" }))
  await user.click(screen.getByRole("button", { name: "Save" }))
  return user
}

describe("outcomes page", () => {
  test("shows the community summary with the opted-in names", async () => {
    serve(() => HttpResponse.json({}))
    renderAdmissionApp(<OutcomesPage />)
    expect(await screen.findByText("Aziza")).toBeTruthy()
    expect(screen.getByText("5 applied · 1 accepted")).toBeTruthy()
  })

  test("creates an outcome", async () => {
    const posted = serve(() =>
      HttpResponse.json(
        {
          id: "o1",
          institution_id: MIT,
          cycle: 2027,
          plan: "rd",
          status: "applied",
          share_name: false,
          lock_version: 1,
          updated_at: "2026-01-01T00:00:00Z",
        },
        { status: 201 },
      ),
    )
    renderAdmissionApp(<OutcomesPage />)
    await fillAndSave()
    await waitFor(() => expect(posted).toHaveLength(1))
    expect(posted[0]).toMatchObject({ institution_id: MIT, plan: "rd", status: "applied", share_name: false })
  })

  test("a duplicate report says so", async () => {
    serve(() =>
      HttpResponse.json(
        { type: "admission/conflict", title: "Conflict", status: 409 },
        { status: 409, headers: { "Content-Type": "application/problem+json" } },
      ),
    )
    renderAdmissionApp(<OutcomesPage />)
    await fillAndSave()
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("already reported"))
  })
})
