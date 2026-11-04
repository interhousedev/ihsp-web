/** AI-8, MCP-5: when the AI limit is reached, the assistant points to the MCP setup wizard. */
import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { LimitMcpPrompt } from "./limit-mcp-prompt"

const CONNECTORS_HREF = "https://id.example.test/connectors/new/"

describe("LimitMcpPrompt", () => {
  it("links to the setup wizard when the session limit is reached", () => {
    renderWithProviders(
      <LimitMcpPrompt limit={{ reached: true, scope: "session", resetsAt: null }} connectorsHref={CONNECTORS_HREF} />,
    )

    const link = screen.getByRole("link", { name: "Set up an AI app" })
    expect(link.getAttribute("href")).toBe(CONNECTORS_HREF)
    expect(link.getAttribute("rel")).toContain("noopener")
  })

  it("renders nothing while the input is open", () => {
    const { container } = renderWithProviders(
      <LimitMcpPrompt limit={{ reached: false }} connectorsHref={CONNECTORS_HREF} />,
    )
    expect(container.textContent).toBe("")
  })

  it("renders nothing when Administration revoked the chat AI", () => {
    const { container } = renderWithProviders(
      <LimitMcpPrompt limit={{ reached: true, scope: "access", resetsAt: null }} connectorsHref={CONNECTORS_HREF} />,
    )
    expect(container.textContent).toBe("")
  })
})
