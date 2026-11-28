/** The public student card behind `/ai/card/?t=<token>` (a permanent token: no expiry). */
import { describe, expect, test } from "bun:test"
import { publicStudentCardNoPhotoToken, publicStudentCardToken } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { CardViewer } from "../features/card/card-viewer"
import { allowSlowTests, renderShare } from "./helpers"

allowSlowTests()

describe("student card", () => {
  test("shows the card: lyceum, full name, year, photo, group, student ID and speciality, no expiry", async () => {
    const { container } = renderShare(<CardViewer />, { route: `/ai/card/?t=${publicStudentCardToken}` })

    expect(await screen.findByRole("heading", { name: "Karimova Aziza Rustamovna" })).toBeInTheDocument()
    expect(screen.getByText("Academic Lyceum International House Tashkent")).toBeInTheDocument()
    expect(screen.getByText("2026-2027")).toBeInTheDocument()
    expect(screen.getByText("11-A")).toBeInTheDocument()
    expect(screen.getByText("ST-2026-0042")).toBeInTheDocument()
    expect(screen.getByText("Biology")).toBeInTheDocument()
    expect(screen.queryByRole("timer")).not.toBeInTheDocument()
    expect(container.querySelector(`img[src$="/photo"]`)).not.toBeNull()
    expect(screen.queryByTestId("person-silhouette")).not.toBeInTheDocument()
  })

  test("a hidden photo shows the gray placeholder and no photo request", async () => {
    const { container } = renderShare(<CardViewer />, { route: `/ai/card/?t=${publicStudentCardNoPhotoToken}` })

    expect(await screen.findByRole("heading", { name: "Karimova Aziza Rustamovna" })).toBeInTheDocument()
    expect(screen.getByTestId("person-silhouette")).toBeInTheDocument()
    expect(container.querySelector(`img[src$="/photo"]`)).toBeNull()
  })

  test("an unknown or replaced token shows the invalid state", async () => {
    renderShare(<CardViewer />, { route: "/ai/card/?t=gone" })

    expect(await screen.findByText("This card code is not valid")).toBeInTheDocument()
  })
})
