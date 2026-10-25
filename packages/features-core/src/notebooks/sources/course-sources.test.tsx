import { describe, expect, it } from "bun:test"
import type { SourceInput } from "@ihsp/api"
import { apiUrl, courseIds, courseWorkspaceReadOnly, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { AddSourcesDialog } from "./add-sources-dialog"
import { SourcesPanel } from "./sources-panel"

allowSlowRenders()

const sourcesUrl = apiUrl(`/v1/notebooks/${courseIds.workspace}/sources`)

describe("AddSourcesDialog in a course workspace", () => {
  it("offers files, course steps, text and link only", async () => {
    renderNotebook(<AddSourcesDialog notebookId={courseIds.workspace} open onOpenChange={() => undefined} />, {
      actions: { notebookId: courseIds.workspace },
    })

    const tabs = within(await screen.findByRole("tablist", { name: /./ })).getAllByRole("tab")
    expect(tabs.map((tab) => tab.textContent)).toEqual(["My files", "Course steps", "Text", "Link"])
  })

  it("adds the DRAFT of a ticked step of the course", async () => {
    const captured: { body: { items: SourceInput[] } | null } = { body: null }
    server.use(
      http.post(sourcesUrl, async ({ request }) => {
        captured.body = (await request.json()) as { items: SourceInput[] }
        return HttpResponse.json({ items: [], rejected: [] }, { status: 201 })
      }),
    )
    const { user } = renderNotebook(
      <AddSourcesDialog notebookId={courseIds.workspace} open onOpenChange={() => undefined} />,
      { actions: { notebookId: courseIds.workspace } },
    )

    await user.click(await screen.findByRole("tab", { name: "Course steps" }))
    expect(await screen.findByText("Motion")).toBeInTheDocument()
    await user.click(await screen.findByRole("checkbox", { name: "Newton's laws" }))
    await user.click(screen.getByRole("button", { name: "Add 1 source" }))

    expect(captured.body).toEqual({
      items: [{ kind: "lms_step", course_id: courseIds.course, step_id: courseIds.stepNewLaws, draft: true }],
    })
  })
})

describe("SourcesPanel for a reader of the course", () => {
  it("has no Add button and no row actions", async () => {
    renderNotebook(<SourcesPanel notebook={courseWorkspaceReadOnly} />, {
      actions: { notebookId: courseIds.workspace },
    })

    expect(await screen.findByText("You can read this workspace but not change it.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add sources" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Actions|More/ })).not.toBeInTheDocument()
  })
})
