import { describe, expect, it } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { AssistantWorkspace } from "./assistant-workspace"

allowSlowRenders()

describe("AssistantWorkspace: administrator", () => {
  it("never asks for notebooks and offers no student study chips", async () => {
    let notebookCalls = 0
    server.use(
      http.get(apiUrl("/v1/notebooks"), () => {
        notebookCalls += 1
        return HttpResponse.json({ type: "about:blank", title: "Forbidden", status: 403 }, { status: 403 })
      }),
    )

    renderNotebook(<AssistantWorkspace assistant="admin" basePath="/assistant" />, { route: "/assistant/" })

    const chips = within(await screen.findByRole("list", { name: "Suggestions" })).getAllByRole("button")
    expect(chips.map((chip) => chip.textContent)).toEqual(["Explain"])
    expect(screen.queryByText("Notebooks")).toBeNull()
    expect(notebookCalls).toBe(0)
  })
})
