/** The public student card behind `/ai/card/?t=<token>`. */
import { describe, expect, test } from "bun:test"
import { apiUrl, publicStudentCard, publicStudentCardToken, server } from "@ihsp/test-utils"
import { HttpResponse, http } from "msw"
import { screen } from "@testing-library/react"
import { CardViewer } from "../features/card/card-viewer"
import { allowSlowTests, renderShare } from "./helpers"

allowSlowTests()

describe("student card", () => {
  test("shows the photo, name, details and the validity of a live token", async () => {
    const { container } = renderShare(<CardViewer />, { route: `/ai/card/?t=${publicStudentCardToken}` })

    expect(await screen.findByRole("heading", { name: "Aziza Karimova" })).toBeInTheDocument()
    expect(screen.getByText("Academic Lyceum")).toBeInTheDocument()
    expect(screen.getByText("11-A")).toBeInTheDocument()
    expect(screen.getByText("Natural sciences")).toBeInTheDocument()
    expect(screen.getByText("Biology")).toBeInTheDocument()
    expect(screen.getByRole("timer").textContent).toMatch(/Valid until \d{2}:\d{2}:\d{2}/)
    expect(container.querySelector(`img[src$="/photo"]`)).not.toBeNull()
  })

  test("an unknown or expired token shows the expired state", async () => {
    renderShare(<CardViewer />, { route: "/ai/card/?t=gone" })

    expect(await screen.findByText("This card code has expired")).toBeInTheDocument()
  })

  test("counts down on the server's clock when the visitor's clock is an hour behind", async () => {
    const serverNow = Date.now() + 3_600_000
    server.use(
      http.get(apiUrl(`/v1/public/student-cards/${publicStudentCardToken}`), () =>
        HttpResponse.json(publicStudentCard({ expires_at: new Date(serverNow + 90_000).toISOString() }), {
          headers: { Date: new Date(serverNow).toUTCString() },
        }),
      ),
    )
    renderShare(<CardViewer />, { route: `/ai/card/?t=${publicStudentCardToken}` })

    expect(await screen.findByRole("heading", { name: "Aziza Karimova" })).toBeInTheDocument()
    expect(screen.getByRole("timer").textContent).toMatch(/01:[23]\d left/)
  })

  test("without a readable Date header the local clock is used", async () => {
    renderShare(<CardViewer />, { route: `/ai/card/?t=${publicStudentCardToken}` })

    expect(await screen.findByRole("heading", { name: "Aziza Karimova" })).toBeInTheDocument()
    expect(screen.getByRole("timer").textContent).toMatch(/01:[23]\d left/)
  })
})
