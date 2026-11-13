/** The public student card behind `/ai/card/?t=<token>`. */
import { describe, expect, test } from "bun:test"
import { publicStudentCardToken } from "@ihsp/test-utils"
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
})
