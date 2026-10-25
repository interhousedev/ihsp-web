import { describe, expect, it, mock } from "bun:test"
import type { SourceItem } from "@ihsp/api"
import {
  apiUrl,
  nbIds,
  notebookDetail,
  notebookEmptyDetail,
  problem,
  seedNotebookSource,
  server,
  sourceFailed,
  sourceFile,
  sourceStale,
} from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourcesPanel } from "./sources-panel"

allowSlowRenders()

const sourcesUrl = (notebookId: string = nbIds.notebook) => apiUrl(`/v1/notebooks/${notebookId}/sources`)

/**
 * `waitFor` on a boolean. A failed element matcher builds a message that prints the element, which is very slow in
 * happy-dom, so conditions that are false at first (an optimistic flip, a closing dialog) are polled this way.
 */
function until(check: () => boolean, timeout?: number) {
  return waitFor(
    () => {
      if (!check()) throw new Error("condition not met yet")
    },
    timeout ? { timeout } : undefined,
  )
}

function isChecked(element: HTMLElement) {
  return element.getAttribute("aria-checked") === "true" || (element as HTMLInputElement).checked === true
}

function isDisabled(element: HTMLElement) {
  return (element as HTMLButtonElement).disabled === true || element.getAttribute("aria-disabled") === "true"
}

function renderPanel(notebook = notebookDetail, onCollapse?: () => void) {
  return renderNotebook(<SourcesPanel notebook={notebook} {...(onCollapse ? { onCollapse } : {})} />, {
    actions: { notebookId: notebook.id },
  })
}

async function rows() {
  return screen.findByRole("checkbox", { name: "Biology 10.pdf" })
}

function fileSource(index: number): SourceItem {
  return {
    ...sourceFile,
    id: `0000001f-0000-4000-8000-00000000${String(index).padStart(4, "0")}`,
    title: `File ${index}.pdf`,
  }
}

describe("SourcesPanel", () => {
  it("lists the sources in groups with a count, a checkbox named by the title and the limit footer", async () => {
    renderPanel()

    expect(await rows()).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Lesson 5: Photosynthesis" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "My notes" })).toBeChecked()
    expect(screen.getByRole("button", { name: /Files\s*\(1\)/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Lesson materials\s*\(1\)/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Pasted text\s*\(1\)/i })).toBeInTheDocument()
    expect(screen.getByText("3 of 50 sources")).toBeInTheDocument()
  })

  it("opens the viewer when a row is clicked", async () => {
    const { user, actions } = renderPanel()
    await rows()

    await user.click(screen.getByRole("button", { name: "Biology 10.pdf" }))

    expect(actions.openSource).toHaveBeenCalledWith(nbIds.sourceFile)
  })

  it("opens the Add sources dialog through the workspace and never renders it itself", async () => {
    const { user, actions } = renderPanel()
    await rows()

    await user.click(screen.getByRole("button", { name: "Add sources" }))

    expect(actions.openAddSources).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("shows the collapse button only when asked to", async () => {
    const onCollapse = mock(() => undefined)
    const { user, unmount } = renderPanel(notebookDetail, onCollapse)
    await rows()

    await user.click(screen.getByRole("button", { name: "Collapse the sources panel" }))
    expect(onCollapse).toHaveBeenCalledTimes(1)
    unmount()

    renderPanel()
    await rows()
    expect(screen.queryByRole("button", { name: "Collapse the sources panel" })).not.toBeInTheDocument()
  })

  it("shows a skeleton while loading and an error with a retry that works", async () => {
    server.use(http.get(sourcesUrl(), () => problem(500, "common/internal", "Boom"), { once: true }))
    const { user } = renderPanel()

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument()
    await user.click(await screen.findByRole("button", { name: "Try again" }))

    expect(await rows()).toBeInTheDocument()
  })

  describe("selection", () => {
    it("select all is checked when everything is selected and toggles every source", async () => {
      const { promise: gate, resolve } = Promise.withResolvers<void>()
      let body: unknown = null
      server.use(
        http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/select`), async ({ request }) => {
          body = await request.json()
          await gate
          return HttpResponse.json([])
        }),
      )
      const { user } = renderPanel()
      await rows()
      const selectAll = screen.getByRole("checkbox", { name: "Select all sources" })
      expect(selectAll).toBeChecked()

      await user.click(selectAll)

      await waitFor(() => expect(body).toEqual({ selected: false }))
      await until(() => !isChecked(screen.getByRole("checkbox", { name: "Biology 10.pdf" })))
      expect(screen.getByRole("checkbox", { name: "My notes" })).not.toBeChecked()
      resolve()
    })

    it("shows the partly selected state and selects the rest", async () => {
      seedNotebookSource({ ...sourceFile, id: nbIds.sourceStale, title: "Extra.pdf", selected: false })
      const { user } = renderPanel()
      await rows()
      const selectAll = await screen.findByRole("checkbox", { name: "Select all sources" })
      await until(() => selectAll.getAttribute("aria-checked") === "mixed")

      await user.click(selectAll)

      await until(() => isChecked(screen.getByRole("checkbox", { name: "Extra.pdf" })))
    })

    it("a group checkbox selects only the sources of that group", async () => {
      const { promise: gate, resolve } = Promise.withResolvers<void>()
      let body: unknown = null
      server.use(
        http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/select`), async ({ request }) => {
          body = await request.json()
          await gate
          return HttpResponse.json([])
        }),
      )
      const { user } = renderPanel()
      await rows()

      await user.click(screen.getByRole("checkbox", { name: "Select all in Files" }))

      await waitFor(() => expect(body).toEqual({ selected: false, ids: [nbIds.sourceFile] }))
      await until(() => !isChecked(screen.getByRole("checkbox", { name: "Biology 10.pdf" })))
      expect(screen.getByRole("checkbox", { name: "My notes" })).toBeChecked()
      resolve()
    })

    it("a row checkbox sends the PATCH and flips at once (optimistic)", async () => {
      const { promise: gate, resolve } = Promise.withResolvers<void>()
      let body: unknown = null
      server.use(
        http.patch(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/${nbIds.sourceText}`), async ({ request }) => {
          body = await request.json()
          await gate
          return HttpResponse.json({ ...sourceFile, id: nbIds.sourceText, selected: false })
        }),
      )
      const { user } = renderPanel()
      await rows()

      await user.click(screen.getByRole("checkbox", { name: "My notes" }))

      await until(() => !isChecked(screen.getByRole("checkbox", { name: "My notes" })))
      expect(body).toEqual({ selected: false })
      resolve()
    })

    it("rolls the checkbox back when the request fails", async () => {
      server.use(
        http.patch(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/${nbIds.sourceText}`), () =>
          problem(500, "common/internal", "Boom"),
        ),
      )
      const { user } = renderPanel()
      await rows()

      await user.click(screen.getByRole("checkbox", { name: "My notes" }))

      await until(() => isChecked(screen.getByRole("checkbox", { name: "My notes" })))
    })
  })

  describe("states of a source", () => {
    it("shows Waiting and Reading with a spinner and stops polling once the source is ready", async () => {
      seedNotebookSource({ ...sourceFile, id: nbIds.sourceStale, title: "New.pdf", status: "pending", selected: true })
      let polls = 0
      const realFetch = globalThis.fetch
      globalThis.fetch = Object.assign((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const url = input instanceof Request ? input.url : String(input)
        if (url.endsWith(`/notebooks/${nbIds.notebook}/sources`) && (init?.method ?? "GET") === "GET") polls += 1
        return realFetch(input, init)
      }, realFetch)
      try {
        renderPanel()

        expect(await screen.findByText("Reading…")).toBeInTheDocument()
        await until(() => screen.queryByText("Reading…") === null, 6000)
        const pollsWhenReady = polls
        await new Promise((resolve) => setTimeout(resolve, 2600))

        expect(polls).toBe(pollsWhenReady)
        expect(screen.getByRole("checkbox", { name: "New.pdf" })).toBeInTheDocument()
      } finally {
        globalThis.fetch = realFetch
      }
    })

    it("shows why a source could not be read and keeps it removable", async () => {
      seedNotebookSource(sourceFailed)
      const { user } = renderPanel()

      expect(await screen.findByText("Could not read: No text found in the source.")).toBeInTheDocument()
      expect(isDisabled(screen.getByRole("checkbox", { name: "Scan 0042.pdf" }))).toBe(true)
      await user.click(screen.getByRole("button", { name: "More actions for Scan 0042.pdf" }))
      expect(await screen.findByRole("menuitem", { name: "Remove" })).toBeInTheDocument()
    })

    it("re-reads a source without text and drops the failure once the text is found", async () => {
      seedNotebookSource(sourceFailed)
      const { user } = renderPanel()

      await user.click(await screen.findByRole("button", { name: "Re-read" }))

      await until(() => screen.queryByText("Could not read: No text found in the source.") === null, 8000)
      expect(screen.queryByRole("button", { name: "Re-read" })).not.toBeInTheDocument()
    })

    it("offers Re-read for a video without captions, and not for a source that failed otherwise", async () => {
      seedNotebookSource({
        ...sourceFailed,
        id: "0000001f-0000-4000-8000-000000000077",
        title: "Lecture video",
        kind: "url",
        failure: "no_transcript",
      })
      seedNotebookSource({
        ...sourceFailed,
        id: "0000001f-0000-4000-8000-000000000078",
        title: "Gone page",
        failure: "fetch_failed",
      })
      renderPanel()

      expect(await screen.findByText("Could not read: This video has no transcript to read.")).toBeInTheDocument()
      expect(screen.getAllByRole("button", { name: "Re-read" })).toHaveLength(1)
    })

    it("marks a source that is not available", async () => {
      seedNotebookSource({ ...sourceFailed, status: "unavailable", failure: "deleted" })
      renderPanel()

      expect(await screen.findByText("Not available: The file was deleted.")).toBeInTheDocument()
    })

    it("shows Outdated with a Sync button that syncs just that source", async () => {
      seedNotebookSource(sourceStale)
      let synced: string | null = null
      server.use(
        http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/:sid/sync`), ({ params }) => {
          synced = String(params.sid)
          return HttpResponse.json({ ...sourceStale, status: "processing", stale: false })
        }),
      )
      const { user } = renderPanel()
      expect(await screen.findByText("Outdated")).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Sync" }))

      await waitFor(() => expect(synced).toBe(nbIds.sourceStale))
      await until(() => screen.queryByText("Outdated") === null)
    })

    it("Sync outdated sources appears only when something is outdated and syncs each one", async () => {
      const { unmount } = renderPanel()
      await rows()
      expect(screen.queryByRole("button", { name: "Sync outdated sources" })).not.toBeInTheDocument()
      unmount()

      seedNotebookSource(sourceStale)
      seedNotebookSource({ ...sourceStale, id: nbIds.sourceFailed, title: "Second chat" })
      const synced: string[] = []
      server.use(
        http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/:sid/sync`), ({ params }) => {
          synced.push(String(params.sid))
          return HttpResponse.json({ ...sourceStale, id: String(params.sid), status: "processing", stale: false })
        }),
      )
      const second = renderPanel()
      await second.user.click(await screen.findByRole("button", { name: "Sync outdated sources" }))

      await waitFor(() => expect(synced.toSorted()).toEqual([nbIds.sourceStale, nbIds.sourceFailed].toSorted()))
    })
  })

  describe("row menu", () => {
    it("removes a source only after the confirmation", async () => {
      const { user } = renderPanel()
      await rows()

      await user.click(screen.getByRole("button", { name: "More actions for My notes" }))
      await user.click(await screen.findByRole("menuitem", { name: "Remove" }))
      const dialog = await screen.findByRole("alertdialog")
      expect(within(dialog).getByText("Remove this source?")).toBeInTheDocument()
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
      await until(() => screen.queryByRole("alertdialog") === null)
      expect(screen.getByRole("checkbox", { name: "My notes" })).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "More actions for My notes" }))
      await user.click(await screen.findByRole("menuitem", { name: "Remove" }))
      await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Remove" }))

      await until(() => screen.queryByRole("checkbox", { name: "My notes" }) === null)
      expect(screen.getByText("2 of 50 sources")).toBeInTheDocument()
    })

    it("renames a source", async () => {
      let body: unknown = null
      server.use(
        http.patch(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/${nbIds.sourceText}`), async ({ request }) => {
          body = await request.json()
          return HttpResponse.json({ ...sourceFile, id: nbIds.sourceText, title: "Exam notes", kind: "text" })
        }),
      )
      const { user } = renderPanel()
      await rows()

      await user.click(screen.getByRole("button", { name: "More actions for My notes" }))
      await user.click(await screen.findByRole("menuitem", { name: "Rename" }))
      const dialog = await screen.findByRole("dialog")
      const field = within(dialog).getByLabelText("Title")
      await user.clear(field)
      await user.click(field)
      await user.paste("Exam notes")
      await user.click(within(dialog).getByRole("button", { name: "Save" }))

      await waitFor(() => expect(body).toEqual({ title: "Exam notes" }))
      await until(() => screen.queryByRole("dialog") === null)
    })

    it("opens the source from the menu", async () => {
      const { user, actions } = renderPanel()
      await rows()

      await user.click(screen.getByRole("button", { name: "More actions for My notes" }))
      await user.click(await screen.findByRole("menuitem", { name: "Open source" }))

      expect(actions.openSource).toHaveBeenCalledWith(nbIds.sourceText)
    })
  })

  describe("list layout", () => {
    it("shows a short list of one kind flat and lets the student group it", async () => {
      seedNotebookSource(fileSource(1), nbIds.notebookEmpty)
      seedNotebookSource(fileSource(2), nbIds.notebookEmpty)
      const { user } = renderPanel(notebookEmptyDetail)

      expect(await screen.findByRole("checkbox", { name: "File 1.pdf" })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /Files\s*\(2\)/i })).not.toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Group by type" }))

      expect(await screen.findByRole("button", { name: /Files\s*\(2\)/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Show as one list" })).toBeInTheDocument()
    })

    it("offers no flat toggle for a mixed list", async () => {
      renderPanel()
      await rows()

      expect(screen.queryByRole("button", { name: "Show as one list" })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Group by type" })).not.toBeInTheDocument()
    })

    it("collapses a group", async () => {
      const { user } = renderPanel()
      await rows()

      await user.click(screen.getByRole("button", { name: /Files\s*\(1\)/i }))

      await until(() => screen.queryByRole("checkbox", { name: "Biology 10.pdf" }) === null)
      expect(screen.getByRole("checkbox", { name: "My notes" })).toBeInTheDocument()
    })

    it("turns the limit footer amber with a hint near the limit", async () => {
      for (let index = 0; index < 42; index += 1) seedNotebookSource(fileSource(index + 10))
      renderPanel()

      expect(await screen.findByText("45 of 50 sources")).toBeInTheDocument()
      expect(screen.getByText("The source limit is almost reached.")).toBeInTheDocument()
    })
  })

  describe("empty state", () => {
    it("offers an upload, My files and a drop zone", async () => {
      const { user, actions } = renderPanel(notebookEmptyDetail)

      expect(await screen.findByText("Add your first source")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Upload a file" })).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "From My files" }))
      expect(actions.openAddSources).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole("checkbox", { name: "Select all sources" })).not.toBeInTheDocument()
    })

    it("uploads a dropped file and adds it as a file source", async () => {
      const captured: { body: { items?: { kind: string; file_id: string }[] } | null } = { body: null }
      server.use(
        http.post(sourcesUrl(nbIds.notebookEmpty), async ({ request }) => {
          captured.body = (await request.json()) as typeof captured.body
          return HttpResponse.json({ items: [], rejected: [] }, { status: 201 })
        }),
      )
      renderPanel(notebookEmptyDetail)
      const zone = (await screen.findByText("Add your first source")).closest(
        "div[class*='border-dashed']",
      ) as HTMLElement

      fireEvent.drop(zone, {
        dataTransfer: { files: [new File(["hello"], "notes.pdf", { type: "application/pdf" })], types: ["Files"] },
      })

      await waitFor(() => expect(captured.body?.items?.[0]?.kind).toBe("file"))
      expect(captured.body?.items).toHaveLength(1)
      expect(typeof captured.body?.items?.[0]?.file_id).toBe("string")
    })
  })
})
