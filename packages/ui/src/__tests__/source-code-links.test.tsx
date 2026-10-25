import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { SOURCE_CODE_BACKEND_URL, SOURCE_CODE_WEB_URL, SourceCodeLinks } from "../components/layout/source-code-links"

describe("SourceCodeLinks", () => {
  it("links the web and backend repositories over https in a new tab with rel noopener", () => {
    renderWithProviders(<SourceCodeLinks />)

    const web = screen.getByRole("link", { name: "Source code: web" })
    const backend = screen.getByRole("link", { name: "Source code: backend" })

    expect(web).toHaveAttribute("href", "https://github.com/interhousedev/ihsp-web")
    expect(backend).toHaveAttribute("href", "https://github.com/interhousedev/ihsp-backend")
    expect(web).toHaveAttribute("target", "_blank")
    expect(backend).toHaveAttribute("rel", "noopener")
    expect(SOURCE_CODE_WEB_URL.startsWith("https://")).toBe(true)
    expect(SOURCE_CODE_BACKEND_URL.startsWith("https://")).toBe(true)
  })
})
