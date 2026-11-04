import { describe, expect, test } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { LicensePackagesPage } from "./license-packages-page"

describe("LicensePackagesPage", () => {
  test("is a page of its own with the title and the list loaded on open, then lists and filters the packages", async () => {
    renderWithProviders(<LicensePackagesPage />)
    expect(screen.getByRole("heading", { name: "Open source packages" })).toBeTruthy()

    const list = await screen.findByRole("list", { name: "Open source packages" })
    expect(list.querySelectorAll("li").length).toBeGreaterThan(100)

    const search = screen.getByRole("searchbox", { name: "Search packages" })
    fireEvent.change(search, { target: { value: "katex" } })
    await waitFor(() => expect(screen.getByRole("link", { name: "katex" })).toBeTruthy())
    expect(screen.getByRole("list", { name: "Open source packages" }).querySelectorAll("li").length).toBeLessThan(5)

    fireEvent.change(search, { target: { value: "no-such-package-xyz" } })
    expect(await screen.findByText("Nothing found")).toBeTruthy()
  })

  test("package links open in a new tab", async () => {
    renderWithProviders(<LicensePackagesPage />)
    await screen.findByRole("list", { name: "Open source packages" })
    const link = screen.getByRole("link", { name: "katex" })
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow")
  })
})
