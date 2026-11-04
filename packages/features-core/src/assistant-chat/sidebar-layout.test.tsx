import { describe, expect, it } from "bun:test"
import { screen, within } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { AssistantWorkspace } from "./assistant-workspace"

allowSlowRenders()

function renderWorkspace(route = "/assistant/") {
  return renderNotebook(<AssistantWorkspace assistant="student" basePath="/assistant" />, { route })
}

describe("AssistantWorkspace: sidebar layout", () => {
  it("starts a new chat from one link in the sidebar, with its icon in the icon column", async () => {
    renderWorkspace("/assistant/chat/?id=c-1")

    const sidebar = await screen.findByRole("navigation", { name: "Chats and notebooks" })
    const newChat = within(sidebar).getByRole("link", { name: "New chat" })
    expect(newChat.getAttribute("href")).toMatch(/^\/assistant\/?$/)
    expect(newChat.querySelector("[data-sidebar-icon-column]")).not.toBeNull()
  })

  it("keeps every row's icon in a column of the same width", async () => {
    renderWorkspace()

    const sidebar = await screen.findByRole("navigation", { name: "Chats and notebooks" })
    const columns = sidebar.querySelectorAll("[data-sidebar-icon-column]")
    expect(columns.length).toBeGreaterThanOrEqual(2)
    const widths = new Set(Array.from(columns, (column) => column.className))
    expect(widths.size).toBe(1)
  })

  it("scrolls Projects, Notebooks and Recents in that order under the pinned rows", async () => {
    renderWorkspace()

    const sidebar = await screen.findByRole("navigation", { name: "Chats and notebooks" })
    const sections = sidebar.querySelector('[data-scroll="sections"]') as HTMLElement
    expect(sections).not.toBeNull()
    const headings = within(sections)
      .getAllByRole("heading")
      .map((heading) => heading.textContent)
    expect(headings).toEqual(["Projects", "Notebooks", "Recents"])
  })

  it("has no account row: the app shell owns it", async () => {
    renderWorkspace()

    const sidebar = await screen.findByRole("navigation", { name: "Chats and notebooks" })
    expect(within(sidebar).queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument()
  })
})
