/** MCP-5: the assistant's left panel links to the MCP setup wizard, named from the app's brand message. */
import { describe, expect, it } from "bun:test"
import { screen, within } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { AssistantWorkspace } from "./assistant-workspace"

allowSlowRenders()

const CONNECTORS_HREF = "https://id.example.test/connectors/new/"

describe("AssistantWorkspace: connect my AI link", () => {
  it("links the sidebar to the setup wizard, named from the app's brand name", async () => {
    renderNotebook(
      <AssistantWorkspace
        assistant="student"
        basePath="/assistant"
        connectorsHref={CONNECTORS_HREF}
        appName="my.iht"
      />,
      { route: "/assistant/" },
    )

    const sidebar = await screen.findByRole("navigation", { name: "Chats and notebooks" })
    const link = within(sidebar).getByRole("link", { name: "Connect my AI to my.iht" })
    expect(link.getAttribute("href")).toBe(CONNECTORS_HREF)
    expect(link.getAttribute("rel")).toContain("noopener")
  })

  it("is left out when the app gives no wizard address", async () => {
    renderNotebook(<AssistantWorkspace assistant="student" basePath="/assistant" />, { route: "/assistant/" })

    const sidebar = await screen.findByRole("navigation", { name: "Chats and notebooks" })
    expect(within(sidebar).queryByRole("link", { name: /Connect my AI/ })).toBeNull()
  })
})
