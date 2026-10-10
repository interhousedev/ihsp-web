import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { Icons } from "../components/icons"
import { StateView } from "../components/state-view"

describe("StateView empty", () => {
  it("shows the icon passed in", () => {
    renderWithProviders(<StateView state="empty" emptyText="No files" icon={<Icons.alertCircle data-testid="given" />} />)
    expect(screen.getByTestId("given")).toBeInTheDocument()
  })

  it("falls back to the inbox icon, not a plain circle", () => {
    const { container } = renderWithProviders(<StateView state="empty" emptyText="No files" />)
    expect(container.querySelector("svg.tabler-icon-inbox")).not.toBeNull()
    expect(container.querySelector("svg.tabler-icon-circle")).toBeNull()
  })
})
