import { describe, expect, it } from "bun:test"
import { projectIds, renderWithProviders } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { AssistantPage } from "./assistant-page"

describe("Staff assistant page (Projects as in sp)", () => {
  it("has the chats and notebooks sidebar with a Projects section", async () => {
    renderWithProviders(<AssistantPage />, { route: "/assistant/" })

    const sidebar = await screen.findByRole("navigation", { name: "Chats and notebooks" })
    expect(within(sidebar).getByRole("button", { name: "Projects" })).toHaveAttribute("aria-expanded", "true")
  })

  it("lists the projects on the projects route", async () => {
    renderWithProviders(<AssistantPage />, { route: "/assistant/projects/" })

    expect(await screen.findByRole("link", { name: /^Physics lab./ })).toBeInTheDocument()
  })

  it("opens a project page with the composer for a chat in that project", async () => {
    renderWithProviders(<AssistantPage />, { route: `/assistant/project/?id=${projectIds.physics}` })

    expect(await screen.findByRole("heading", { level: 1, name: "Physics lab" })).toBeInTheDocument()
    expect(await screen.findByRole("textbox", { name: "Message" })).toHaveAttribute(
      "placeholder",
      "New chat in Physics lab",
    )
  })
})
