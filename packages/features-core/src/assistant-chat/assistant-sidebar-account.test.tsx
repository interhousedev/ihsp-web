import { describe, expect, it } from "bun:test"
import { screen, within } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { AssistantWorkspace, type AssistantWorkspaceProps } from "./assistant-workspace"

allowSlowRenders()

function renderWorkspace(links: Partial<AssistantWorkspaceProps> = {}) {
  return renderNotebook(<AssistantWorkspace assistant="student" basePath="/assistant" {...links} />, {
    route: "/assistant/",
  })
}

async function sidebar() {
  return screen.findByRole("navigation", { name: "Chats and notebooks" })
}

describe("AssistantWorkspace: Library entry", () => {
  it("links to the library from the sidebar when the app has one", async () => {
    renderWorkspace({ libraryHref: "/files/" })

    const nav = await sidebar()
    expect(within(nav).getByRole("link", { name: "Library" }).getAttribute("href")).toMatch(/^\/files\/?$/)
  })

  it("has no Library entry where the app has no library page", async () => {
    renderWorkspace()

    const nav = await sidebar()
    expect(within(nav).queryByRole("link", { name: "Library" })).not.toBeInTheDocument()
  })
})
