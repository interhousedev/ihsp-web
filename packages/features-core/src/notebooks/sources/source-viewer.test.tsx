import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import type { PassageItem } from "@ihsp/api"
import {
  apiUrl,
  nbIds,
  passageId,
  problem,
  seedNotebookSource,
  server,
  sourceDetailOf,
  sourceFailed,
  sourceFile,
  sourceGuide,
  sourceStale,
} from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourceViewer } from "./source-viewer"

allowSlowRenders()

const scrollIntoView = mock((_options?: ScrollIntoViewOptions) => undefined)

beforeEach(() => {
  scrollIntoView.mockClear()
  Element.prototype.scrollIntoView = scrollIntoView
})

afterEach(() => {
  window.getSelection()?.removeAllRanges()
})

function renderViewer(sourceId: string = nbIds.sourceFile, passage?: string) {
  return renderNotebook(
    <SourceViewer notebookId={nbIds.notebook} sourceId={sourceId} {...(passage ? { passageId: passage } : {})} />,
  )
}

const sourceUrl = (sourceId: string) => apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/${sourceId}`)

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

function isDisabled(element: HTMLElement) {
  return (element as HTMLButtonElement).disabled === true || element.getAttribute("aria-disabled") === "true"
}

function manyPassages(count: number): PassageItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `0000002a-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    seq: index + 1,
    text: `Passage number ${index + 1}.`,
    page: null,
    heading: null,
  }))
}

/** Two pages of passages: 60 on the first, the rest on the second (cursor `next`). */
function servePassagePages(all: PassageItem[]) {
  const cursors: (string | null)[] = []
  server.use(
    http.get(`${sourceUrl(nbIds.sourceFile)}/passages`, ({ request }) => {
      const cursor = new URL(request.url).searchParams.get("cursor")
      cursors.push(cursor)
      return cursor
        ? HttpResponse.json({ items: all.slice(60), next_cursor: null })
        : HttpResponse.json({ items: all.slice(0, 60), next_cursor: "next" })
    }),
  )
  return cursors
}

function selectText(node: Node, start: number, end: number) {
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, end)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  document.dispatchEvent(new Event("selectionchange"))
}

describe("SourceViewer", () => {
  it("shows the title, the guide, the passages with page markers and bold headings", async () => {
    renderViewer()

    expect(await screen.findByRole("heading", { level: 2, name: "Biology 10.pdf" })).toBeInTheDocument()
    expect(await screen.findByText(/Photosynthesis is the process by which plants/)).toBeInTheDocument()
    expect(screen.getByText("Page 1")).toBeInTheDocument()
    expect(screen.getByText("Page 2")).toBeInTheDocument()
    expect(screen.getByText("Page 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3, name: "Calvin cycle" })).toHaveClass("font-bold")
    expect(screen.getByText("Source guide")).toBeInTheDocument()
    expect(await screen.findByText(/A short chapter on/)).toBeInTheDocument()
  })

  it("asks the chat about a key topic with only this source selected", async () => {
    const { user, actions } = renderViewer()

    await user.click(await screen.findByRole("button", { name: sourceGuide.key_topics[2] as string }))

    expect(actions.ask).toHaveBeenCalledWith({
      text: "Tell me about Calvin cycle",
      sourceIds: [nbIds.sourceFile],
    })
  })

  it("goes back to the chat", async () => {
    const { user, actions } = renderViewer()

    await user.click(await screen.findByRole("button", { name: "Back to chat" }))

    expect(actions.closeViewer).toHaveBeenCalledTimes(1)
  })

  it("says Summarizing while the guide is being built", async () => {
    server.use(
      http.get(sourceUrl(nbIds.sourceFile), () =>
        HttpResponse.json({ ...sourceDetailOf(sourceFile), has_guide: false, guide: null }),
      ),
    )
    renderViewer()

    expect(await screen.findByText("Summarizing…")).toBeInTheDocument()
  })

  it("shows no guide card for a pasted text", async () => {
    renderViewer(nbIds.sourceText)

    expect(await screen.findByRole("heading", { level: 2, name: "My notes" })).toBeInTheDocument()
    expect(await screen.findByText(/Remember: light reactions/)).toBeInTheDocument()
    expect(screen.queryByText("Source guide")).not.toBeInTheDocument()
    expect(screen.queryByText("Summarizing…")).not.toBeInTheDocument()
  })

  it("offers Edit only for pasted text and notes", async () => {
    const { user, actions, unmount } = renderViewer(nbIds.sourceText)

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    expect(actions.openNoteEditor).toHaveBeenCalledWith(nbIds.sourceText)
    unmount()

    renderViewer(nbIds.sourceFile)
    await screen.findByText(/Photosynthesis is the process/)
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument()
  })

  describe("opened from a citation", () => {
    it("scrolls to the cited passage and highlights it", async () => {
      renderViewer(nbIds.sourceFile, passageId(1, 5))

      const passage = (await screen.findByText(/The Calvin cycle takes place in the stroma/)).closest(
        "[data-passage-id]",
      )
      await until(() => passage?.getAttribute("data-highlighted") === "true")
      expect(passage).toHaveClass("bg-primary/15")
      expect(passage).toHaveClass("ring-2")
      expect(scrollIntoView).toHaveBeenCalledTimes(1)
      expect(scrollIntoView.mock.calls[0]?.[0]).toMatchObject({ block: "center" })
      // The other passages are not highlighted.
      expect(
        screen.getByText(/Photosynthesis takes place in chloroplasts/).closest("[data-passage-id]"),
      ).not.toHaveAttribute("data-highlighted")
    })

    it("loads more pages until the cited passage is in the list", async () => {
      const all = manyPassages(75)
      const cursors = servePassagePages(all)
      const target = all[70] as PassageItem
      renderViewer(nbIds.sourceFile, target.id)

      const passage = (await screen.findByText("Passage number 71.", {}, { timeout: 8000 })).closest(
        "[data-passage-id]",
      )

      expect(cursors).toEqual([null, "next"])
      await until(() => passage?.getAttribute("data-highlighted") === "true")
      expect(scrollIntoView).toHaveBeenCalled()
    })

    it("tells the student the source changed when the passage is gone", async () => {
      renderViewer(nbIds.sourceFile, "0000002a-0000-4000-8000-00000000dead")

      expect(await screen.findByText("Source changed")).toBeInTheDocument()
      expect(scrollIntoView).not.toHaveBeenCalled()
      expect(screen.getByText(/Photosynthesis is the process by which plants/)).toBeInTheDocument()
    })
  })

  describe("long texts", () => {
    it("loads 60 passages first and the rest with Load more", async () => {
      const cursors = servePassagePages(manyPassages(75))
      const { user } = renderViewer()

      expect(await screen.findByText("Passage number 60.")).toBeInTheDocument()
      expect(screen.queryByText("Passage number 61.")).not.toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Load more" }))

      expect(await screen.findByText("Passage number 75.")).toBeInTheDocument()
      expect(cursors).toEqual([null, "next"])
      expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument()
    })
  })

  describe("Ask about this", () => {
    it("sends the selected text with a text anchor from the top bar button", async () => {
      const { user, actions } = renderViewer()
      const paragraph = (await screen.findByText(/Photosynthesis takes place in chloroplasts/)) as HTMLElement
      const button = screen.getByRole("button", { name: "Ask about this" })
      expect(button).toBeDisabled()

      selectText(paragraph.firstChild as Node, 0, 42)
      await until(() => !isDisabled(button))
      await user.click(button)

      expect(actions.ask).toHaveBeenCalledWith({
        text: "Photosynthesis takes place in chloroplasts",
        anchor: { kind: "text", text: "Photosynthesis takes place in chloroplasts" },
      })
    })

    it("shows a floating toolbar over the selection", async () => {
      const original = Range.prototype.getBoundingClientRect
      Range.prototype.getBoundingClientRect = () => new DOMRect(200, 300, 120, 20)
      try {
        const { user, actions } = renderViewer()
        const paragraph = (await screen.findByText(/Photosynthesis takes place in chloroplasts/)) as HTMLElement

        selectText(paragraph.firstChild as Node, 0, 14)

        const toolbar = await screen.findByRole("group", { name: "Ask about this" })
        await user.click(within(toolbar).getByRole("button", { name: "Ask about this" }))
        expect(actions.ask).toHaveBeenCalledWith({
          text: "Photosynthesis",
          anchor: { kind: "text", text: "Photosynthesis" },
        })
      } finally {
        Range.prototype.getBoundingClientRect = original
      }
    })

    it("ignores a selection outside the text", async () => {
      renderViewer()
      await screen.findByText(/Photosynthesis takes place in chloroplasts/)
      const title = screen.getByRole("heading", { level: 2, name: "Biology 10.pdf" })

      selectText(title.firstChild as Node, 0, 5)

      expect(screen.getByRole("button", { name: "Ask about this" })).toBeDisabled()
    })
  })

  describe("states of a source", () => {
    it("shows why a failed source has no text", async () => {
      seedNotebookSource(sourceFailed)
      renderViewer(nbIds.sourceFailed)

      expect(await screen.findByText("Could not read: No text found in the source.")).toBeInTheDocument()
      expect(screen.queryByText("Source guide")).not.toBeInTheDocument()
    })

    it("offers Sync for an outdated source and keeps showing its text", async () => {
      seedNotebookSource(sourceStale)
      let synced = false
      server.use(
        http.post(`${sourceUrl(nbIds.sourceStale)}/sync`, () => {
          synced = true
          return HttpResponse.json({ ...sourceStale, status: "processing", stale: false })
        }),
      )
      const { user } = renderViewer(nbIds.sourceStale)

      expect(await screen.findByText("Outdated")).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Sync" }))

      await waitFor(() => expect(synced).toBe(true))
    })

    it("shows a skeleton while loading and an error with a retry", async () => {
      server.use(http.get(sourceUrl(nbIds.sourceFile), () => problem(500, "common/internal", "Boom"), { once: true }))
      const { user } = renderViewer()

      expect(screen.getByRole("status", { name: "Loading…" })).toBeInTheDocument()
      await user.click(await screen.findByRole("button", { name: "Try again" }))

      expect(await screen.findByRole("heading", { level: 2, name: "Biology 10.pdf" })).toBeInTheDocument()
    })
  })

  describe("menu", () => {
    it("removes the source after a confirmation and returns to the chat", async () => {
      const { user, actions } = renderViewer()
      await screen.findByText(/Photosynthesis is the process/)

      await user.click(screen.getByRole("button", { name: "More actions for Biology 10.pdf" }))
      await user.click(await screen.findByRole("menuitem", { name: "Remove" }))
      await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Remove" }))

      await waitFor(() => expect(actions.closeViewer).toHaveBeenCalledTimes(1))
    })

    it("renames the source", async () => {
      let body: unknown = null
      server.use(
        http.patch(sourceUrl(nbIds.sourceFile), async ({ request }) => {
          body = await request.json()
          return HttpResponse.json({ ...sourceFile, title: "Biology notes" })
        }),
      )
      const { user } = renderViewer()
      await screen.findByText(/Photosynthesis is the process/)

      await user.click(screen.getByRole("button", { name: "More actions for Biology 10.pdf" }))
      expect(screen.queryByRole("menuitem", { name: "Open source" })).not.toBeInTheDocument()
      await user.click(await screen.findByRole("menuitem", { name: "Rename" }))
      const field = within(await screen.findByRole("dialog")).getByLabelText("Title")
      await user.clear(field)
      await user.click(field)
      await user.paste("Biology notes")
      fireEvent.submit(field.closest("form") as HTMLFormElement)

      await waitFor(() => expect(body).toEqual({ title: "Biology notes" }))
    })
  })
})
