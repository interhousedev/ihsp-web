import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { Button } from "../components/ui/button"
import { IconShare } from "../components/icons"
import { IconButton } from "../components/ui/icon-button"

describe("touch targets", () => {
  it("default, sm, lg and icon buttons are 44 px on phones and compact from md", () => {
    renderWithProviders(
      <>
        <Button>Default</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Icon" />
        <Button size="dense">Dense</Button>
        <IconButton icon={IconShare} aria-label="Share" />
      </>,
    )
    for (const name of ["Default", "Small", "Large"]) {
      expect(screen.getByRole("button", { name }).className).toContain("min-h-11")
    }
    expect(screen.getByRole("button", { name: "Default" }).className).toContain("md:min-h-8")
    expect(screen.getByRole("button", { name: "Icon" }).className).toContain("min-w-11")
    expect(screen.getByRole("button", { name: "Share" }).className).toContain("min-h-11")
    expect(screen.getByRole("button", { name: "Dense" }).className).not.toContain("min-h-11")
  })
})
