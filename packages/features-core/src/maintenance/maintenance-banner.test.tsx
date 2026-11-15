import { describe, expect, it } from "bun:test"
import { apiUrl, renderWithProviders, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { MaintenanceBanner } from "./maintenance-banner"

function maintenance(body: object) {
  server.use(http.get(apiUrl("/v1/public/maintenance"), () => HttpResponse.json(body)))
}

describe("MaintenanceBanner", () => {
  it("is hidden while there is no maintenance", async () => {
    maintenance({ active: false, moved: false, since: null, target_url: null })
    renderWithProviders(<MaintenanceBanner />)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByTestId("maintenance-banner")).toBeNull()
  })

  it("shows the notice while the platform is read-only", async () => {
    maintenance({ active: true, moved: false, since: "2026-11-15T10:00:00Z", target_url: null })
    renderWithProviders(<MaintenanceBanner />)
    expect(await screen.findByTestId("maintenance-banner")).toBeInTheDocument()
    expect(screen.getByText(/read-only/)).toBeInTheDocument()
    expect(screen.queryByRole("link")).toBeNull()
  })

  it("links to the new server once the platform has moved", async () => {
    maintenance({ active: true, moved: true, since: null, target_url: "https://new.example" })
    renderWithProviders(<MaintenanceBanner />)
    const link = await screen.findByRole("link", { name: "Open the new server" })
    expect(link.getAttribute("href")).toBe("https://new.example")
    expect(screen.getByText("The platform has moved to a new server.")).toBeInTheDocument()
  })
})
