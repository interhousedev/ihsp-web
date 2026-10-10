import { describe, expect, it } from "bun:test"
import { keys } from "@ihsp/api"
import {
  apiUrl,
  artifactDetailOf,
  artifactFailed,
  artifactGenerating,
  artifactReport,
  createTestQueryClient,
  nbIds,
  notebookArtifacts,
  server,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { ArtifactViewer } from "./artifact-viewer"

allowSlowRenders()

const artifactUrl = (id: string) => apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/${id}`)

function renderViewer(artifactId: string, options: Parameters<typeof renderNotebook>[1] = {}) {
  return renderNotebook(<ArtifactViewer notebookId={nbIds.notebook} artifactId={artifactId} />, options)
}

describe("ArtifactViewer: shell", () => {
  it("shows a skeleton while loading and then the viewer of the kind", async () => {
    renderViewer(nbIds.report)

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument()
    expect(await screen.findByRole("article", { name: "Photosynthesis: conspect" })).toBeInTheDocument()
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument()
  })

  it("is a region named by the title, which gets the focus", async () => {
    renderViewer(nbIds.report)

    const title = await screen.findByRole("heading", {
      level: 2,
      name: "Photosynthesis: conspect",
    })
    expect(screen.getByRole("region", { name: "Photosynthesis: conspect" })).toBeInTheDocument()
    expect(title).toHaveFocus()
  })

  it("gives the focus back to the element that had it when the viewer closes", async () => {
    const opener = document.createElement("button")
    document.body.append(opener)
    opener.focus()
    const { unmount } = renderViewer(nbIds.report)
    await screen.findByRole("heading", {
      level: 2,
      name: "Photosynthesis: conspect",
    })

    unmount()

    expect(opener).toHaveFocus()
    opener.remove()
  })

  it("goes back to the chat with the Back button", async () => {
    const { user, actions } = renderViewer(nbIds.report)

    await user.click(await screen.findByRole("button", { name: "Back to chat" }))

    expect(actions.closeViewer).toHaveBeenCalledTimes(1)
  })

  it("picks the viewer by kind", async () => {
    const quiz = renderViewer(nbIds.quiz)
    expect(await screen.findByText("Question 1 of 4")).toBeInTheDocument()
    quiz.unmount()

    const cards = renderViewer(nbIds.flashcards)
    expect(await screen.findByText("Card 1 of 6")).toBeInTheDocument()
    cards.unmount()

    renderViewer(nbIds.dataTable)
    expect(await screen.findByRole("table", { name: "Stages of photosynthesis" })).toBeInTheDocument()
  })

  it("refreshes the Studio list once the item is loaded, so the blue dot clears", async () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(keys.notebooks.artifacts(nbIds.notebook), notebookArtifacts)
    renderViewer(nbIds.report, { queryClient })

    await screen.findByRole("article")

    await waitFor(() =>
      expect(queryClient.getQueryState(keys.notebooks.artifacts(nbIds.notebook))?.isInvalidated).toBe(true),
    )
  })

  it("shows the note for a large notebook that was only sampled", async () => {
    server.use(
      http.get(artifactUrl(nbIds.report), () =>
        HttpResponse.json({
          ...artifactDetailOf(artifactReport),
          sampled: true,
        }),
      ),
    )
    renderViewer(nbIds.report)

    expect(await screen.findByRole("note")).toHaveTextContent("Large notebook: based on a sample of the text.")
  })

  it("does not show the note for a complete result", async () => {
    renderViewer(nbIds.report)
    await screen.findByRole("article")

    expect(screen.queryByRole("note")).not.toBeInTheDocument()
  })
})

describe("ArtifactViewer: states", () => {
  it("shows an error with Try again when the item cannot be loaded", async () => {
    let calls = 0
    server.use(
      http.get(artifactUrl(nbIds.report), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ type: "internal", title: "Oops", status: 500 }, { status: 500 })
          : HttpResponse.json(artifactDetailOf(artifactReport))
      }),
    )
    const { user } = renderViewer(nbIds.report)

    const alert = await screen.findByRole("alert")
    expect(alert).toBeInTheDocument()
    await user.click(within(alert).getByRole("button", { name: "Try again" }))

    expect(await screen.findByRole("article")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back to chat" })).toBeInTheDocument()
  })

  it("keeps Back available when loading fails", async () => {
    server.use(
      http.get(artifactUrl(nbIds.report), () =>
        HttpResponse.json({ type: "internal", title: "Oops", status: 500 }, { status: 500 }),
      ),
    )
    const { user, actions } = renderViewer(nbIds.report)
    await screen.findByRole("alert")

    await user.click(screen.getByRole("button", { name: "Back to chat" }))

    expect(actions.closeViewer).toHaveBeenCalled()
  })

  it("shows the reason of a failed item and starts it again with Try again", async () => {
    const { user } = renderViewer(nbIds.failed)

    expect(await screen.findByText("Could not create")).toBeInTheDocument()
    expect(screen.getByText("The result was not valid. Try again.")).toBeInTheDocument()
    expect(screen.queryByRole("article")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText(/Generating… this can take a minute/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument()
  })

  it("shows the message of the error code, or a generic one", async () => {
    server.use(
      http.get(artifactUrl(nbIds.failed), () =>
        HttpResponse.json({
          ...artifactDetailOf(artifactFailed),
          error: { code: "something_new", message_key: "x", params: {} },
        }),
      ),
    )
    renderViewer(nbIds.failed)

    expect(await screen.findByText("Could not create this material.")).toBeInTheDocument()
  })

  it("shows an inline error when Try again is refused", async () => {
    server.use(
      http.post(`${artifactUrl(nbIds.failed)}/retry`, () =>
        HttpResponse.json(
          { type: "notebooks/busy", title: "Busy", status: 409 },
          {
            status: 409,
            headers: { "Content-Type": "application/problem+json" },
          },
        ),
      ),
    )
    const { user } = renderViewer(nbIds.failed)

    await user.click(await screen.findByRole("button", { name: "Try again" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Three items are already being created")
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled()
  })

  it("says that a canceled item was canceled", async () => {
    server.use(
      http.get(artifactUrl(nbIds.generating), () =>
        HttpResponse.json(
          artifactDetailOf({
            ...artifactGenerating,
            status: "canceled",
            progress: null,
          }),
        ),
      ),
    )
    renderViewer(nbIds.generating)

    expect(await screen.findByText("Canceled.")).toBeInTheDocument()
  })

  it("waits for a generating item and shows it when it is ready", async () => {
    let calls = 0
    server.use(
      http.get(artifactUrl(nbIds.generating), () => {
        calls += 1
        return HttpResponse.json(
          calls === 1
            ? artifactDetailOf(artifactGenerating)
            : artifactDetailOf({
                ...artifactGenerating,
                status: "ready",
                progress: null,
                title: "Photosynthesis: quiz",
              }),
        )
      }),
    )
    renderViewer(nbIds.generating)

    expect(await screen.findByText(/Generating… this can take a minute/)).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Quiz" })).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40")

    expect(await screen.findByText("Question 1 of 4", {}, { timeout: 6000 })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Photosynthesis: quiz" })).toBeInTheDocument()
    expect(screen.queryByText(/Generating…/)).not.toBeInTheDocument()
    expect(calls).toBe(2)
  })
})

describe("ArtifactViewer: item menu", () => {
  it("renames the item and shows the new title", async () => {
    const { user } = renderViewer(nbIds.quiz)
    await screen.findByText("Question 1 of 4")

    await user.click(screen.getByRole("button", { name: "More" }))
    await user.click(await screen.findByRole("menuitem", { name: "Rename" }))
    const dialog = await screen.findByRole("dialog")
    const field = within(dialog).getByRole("textbox", { name: "Title" })
    expect(field).toHaveValue("Photosynthesis: quiz")
    await user.clear(field)
    await user.paste("Calvin cycle quiz")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Calvin cycle quiz",
      }),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("offers Download, Share and Add to my files in the header menu, and saves a copy to My files", async () => {
    let asked: unknown
    server.use(
      http.post(`${artifactUrl(nbIds.report)}/save-to-files`, async ({ request }) => {
        asked = await request.json()
        return HttpResponse.json({ id: "f1", name: "Report.docx", content_type: "x", byte_size: 4 }, { status: 201 })
      }),
    )
    const { user } = renderViewer(nbIds.report)
    await screen.findByRole("article", { name: "Photosynthesis: conspect" })

    await user.click(screen.getByRole("button", { name: "More" }))
    expect(await screen.findByRole("menuitem", { name: "Download .docx" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Share" })).toBeInTheDocument()
    await user.click(screen.getByRole("menuitem", { name: "Add to my files" }))

    await waitFor(() => expect(asked).toEqual({ format: "docx" }))
  })

  it("deletes the item after a confirmation and closes the viewer", async () => {
    const { user, actions } = renderViewer(nbIds.quiz)
    await screen.findByText("Question 1 of 4")

    await user.click(screen.getByRole("button", { name: "More" }))
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Delete this item?")).toBeInTheDocument()
    expect(actions.closeViewer).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(actions.closeViewer).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole("region")).not.toBeInTheDocument()
  })

  it("keeps the viewer open when the confirmation is canceled", async () => {
    const { user, actions } = renderViewer(nbIds.report)
    await screen.findByRole("article")

    await user.click(screen.getByRole("button", { name: "More" }))
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }))
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Cancel",
      }),
    )

    expect(actions.closeViewer).not.toHaveBeenCalled()
    expect(screen.getByRole("article")).toBeInTheDocument()
  })
})
