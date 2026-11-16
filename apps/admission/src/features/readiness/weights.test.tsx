import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { ReadinessWeightsBody } from "./weights-page"

const URL = "/v1/admission/readiness/weights"

describe("readiness weights admin", () => {
  test("loads the weights and saves an edit through PUT", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl(URL), () => HttpResponse.json({ weights: { profile: 15, essays: 20 } })),
      http.put(apiUrl(URL), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(body as object)
      }),
    )
    renderAdmissionApp(<ReadinessWeightsBody />)
    fireEvent.change(await screen.findByLabelText("Essays"), { target: { value: "30" } })
    expect(screen.getByText("Total: 45")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(body).toEqual({ weights: { profile: 15, essays: 30 } }))
  })
})
