import { describe, expect, test } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { LicenseSection } from "./license-section"
import { loadLicensedPackages } from "./licenses"
import { LICENSE_PACKAGES_PATH, PROJECT_LICENSE, SOURCE_CODE_BACKEND_URL, SOURCE_CODE_WEB_URL } from "./project-license"

describe("LicenseSection", () => {
  test("states the AGPL-3.0-only notice and links both source repositories over https in a new tab", () => {
    renderWithProviders(<LicenseSection />)

    expect(screen.getByText(/AGPL-3\.0-only|GNU Affero General Public License/)).toBeTruthy()
    expect(PROJECT_LICENSE).toBe("AGPL-3.0-only")

    const web = screen.getByRole("link", { name: "Web apps repository" })
    const backend = screen.getByRole("link", { name: "Backend repository" })
    expect(web).toHaveAttribute("href", SOURCE_CODE_WEB_URL)
    expect(backend).toHaveAttribute("href", SOURCE_CODE_BACKEND_URL)
    expect(web).toHaveAttribute("target", "_blank")
    expect(backend).toHaveAttribute("rel", "noopener noreferrer")
    expect(SOURCE_CODE_WEB_URL.startsWith("https://")).toBe(true)
    expect(SOURCE_CODE_BACKEND_URL.startsWith("https://")).toBe(true)
  })

  test("links the open source packages to their own page in a new tab, without listing them inline", () => {
    renderWithProviders(<LicenseSection />)

    expect(screen.queryByRole("list", { name: "Open source packages" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Open source packages" })).toBeNull()
    const link = screen.getByRole("link", { name: "Open source packages" })
    expect(link).toHaveAttribute("href", LICENSE_PACKAGES_PATH)
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })
})

describe("generated license list", () => {
  test("has web and backend packages, each with a name, version, license and https link", async () => {
    const packages = await loadLicensedPackages()
    const ecosystems = new Set(packages.map((item) => item.ecosystem))
    expect(ecosystems).toEqual(new Set(["npm", "PyPI"]))
    for (const item of packages) {
      expect(item.name).not.toBe("")
      expect(item.version).not.toBe("")
      expect(item.license).not.toBe("")
      expect(item.url.startsWith("https://")).toBe(true)
    }
  })
})
