import { describe, expect, it } from "bun:test"
import type { NotebookAutoPatchBody, NotebookDetail } from "@ihsp/api"
import { apiUrl, nbIds, notebookDetail, server, sourceLesson } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourcesPanel } from "./sources-panel"

allowSlowRenders()

const subjectNotebook: NotebookDetail = {
  ...notebookDetail,
  origin: "subject_auto",
  auto: { excluded_refs: [], include_classmates: false, synced_at: "2026-10-07T04:01:00Z" },
}

function renderPanel(notebook: NotebookDetail) {
  return renderNotebook(<SourcesPanel notebook={notebook} />, { actions: { notebookId: notebook.id } })
}

function rowOf(title: string): HTMLElement {
  const row = screen.getByRole("checkbox", { name: title }).closest("li")
  if (!row) throw new Error(`no row for ${title}`)
  return row
}

describe("SourcesPanel in a subject notebook", () => {
  it("lets the student add sources and marks synced ones as from lessons", async () => {
    renderPanel(subjectNotebook)
    await screen.findByRole("checkbox", { name: sourceLesson.title })

    expect(screen.getByRole("button", { name: "Add sources" })).toBeEnabled()
    expect(within(rowOf(sourceLesson.title)).getByText("From lessons")).toBeInTheDocument()
    expect(within(rowOf("Biology 10.pdf")).queryByText("From lessons")).toBeNull()
  })

  it("offers Exclude instead of Remove for a synced source and Remove for an own one", async () => {
    let body: NotebookAutoPatchBody | null = null
    server.use(
      http.patch(apiUrl(`/v1/notebooks/${nbIds.notebook}/auto`), async ({ request }) => {
        body = (await request.json()) as NotebookAutoPatchBody
        return HttpResponse.json(subjectNotebook)
      }),
    )
    const { user } = renderPanel(subjectNotebook)
    await screen.findByRole("checkbox", { name: sourceLesson.title })

    await user.click(screen.getByRole("button", { name: `More actions for ${sourceLesson.title}` }))
    expect(screen.queryByRole("menuitem", { name: "Remove" })).toBeNull()
    await user.click(await screen.findByRole("menuitem", { name: "Exclude" }))

    await waitFor(() => expect(body).toEqual({ exclude_source_ids: [sourceLesson.id] }))
    await waitFor(() => expect(screen.queryByRole("checkbox", { name: sourceLesson.title })).toBeNull())

    await user.click(screen.getByRole("button", { name: "More actions for Biology 10.pdf" }))
    expect(await screen.findByRole("menuitem", { name: "Remove" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Exclude" })).toBeNull()
  })

  it("keeps Remove and no badge in a personal notebook", async () => {
    const { user } = renderPanel(notebookDetail)
    await screen.findByRole("checkbox", { name: sourceLesson.title })

    expect(screen.queryByText("From lessons")).toBeNull()
    await user.click(screen.getByRole("button", { name: `More actions for ${sourceLesson.title}` }))
    expect(await screen.findByRole("menuitem", { name: "Remove" })).toBeInTheDocument()
  })
})
