import { describe, expect, it } from "bun:test"
import type { SourceItem } from "@ihsp/api"
import { apiUrl, nbIds, notebookDetail, notebookSources, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourcesPanel } from "./sources-panel"
import { NotebookUploadScope } from "./notebook-upload-scope"

allowSlowRenders()

const sourcesUrl = apiUrl(`/v1/notebooks/${nbIds.notebook}/sources`)
const [readyText] = notebookSources.slice(-1) as [SourceItem]

/** A source the AI is still reading: its checkbox is disabled and the sparkle explains why. */
const reading: SourceItem = {
  ...readyText,
  id: nbIds.sourceStale,
  title: "Lecture scan",
  status: "processing",
  failure: null,
  selected: false,
}

/** A scanned PDF with no text: a warning with the reason, and a Re-read action. */
const scanned: SourceItem = {
  ...readyText,
  id: nbIds.sourceFailed,
  title: "Scanned worksheet",
  status: "failed",
  failure: "no_text",
  selected: false,
}

describe("sources that are not ready", () => {
  it("disables the checkbox of a source being read and explains it on the sparkle", async () => {
    server.use(http.get(sourcesUrl, () => HttpResponse.json([reading])))
    renderNotebook(<SourcesPanel notebook={notebookDetail} />, { actions: { notebookId: nbIds.notebook } })

    expect(await screen.findByRole("img", { name: "AI is reading this file… it will be available soon" })).toBeVisible()
    expect(screen.getByRole("checkbox", { name: "Lecture scan" })).toHaveAttribute("aria-disabled", "true")
  })

  it("warns about a source without readable text and offers Re-read", async () => {
    server.use(http.get(sourcesUrl, () => HttpResponse.json([scanned])))
    renderNotebook(<SourcesPanel notebook={notebookDetail} />, { actions: { notebookId: nbIds.notebook } })

    expect(await screen.findByRole("img", { name: "No readable text found" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Re-read" })).toBeEnabled()
  })
})

describe("dropping files on the notebook page", () => {
  it("shows the drop overlay while files hover over the page and hides it when they leave", async () => {
    renderNotebook(
      <NotebookUploadScope notebookId={nbIds.notebook} canWrite>
        <p>Page content</p>
      </NotebookUploadScope>,
      { actions: { notebookId: nbIds.notebook } },
    )
    const page = screen.getByText("Page content").parentElement as HTMLElement
    const dataTransfer = { types: ["Files"], files: [] }

    fireEvent.dragEnter(page, { dataTransfer })
    expect(await screen.findByText("Drop files to add as sources")).toBeInTheDocument()

    fireEvent.dragLeave(page, { dataTransfer })
    await waitFor(() => expect(screen.queryByText("Drop files to add as sources")).not.toBeInTheDocument())
  })

  it("ignores drags that carry no files", () => {
    renderNotebook(
      <NotebookUploadScope notebookId={nbIds.notebook} canWrite>
        <p>Page content</p>
      </NotebookUploadScope>,
      { actions: { notebookId: nbIds.notebook } },
    )
    const page = screen.getByText("Page content").parentElement as HTMLElement

    fireEvent.dragEnter(page, { dataTransfer: { types: ["text/plain"], files: [] } })

    expect(screen.queryByText("Drop files to add as sources")).not.toBeInTheDocument()
  })
})
