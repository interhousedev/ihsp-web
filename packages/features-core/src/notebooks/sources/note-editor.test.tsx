import { describe, expect, it } from "bun:test"
import { apiUrl, citation1, nbIds, problem, server, sourceDetailOf, sourceText } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { NoteEditor } from "./note-editor"

allowSlowRenders()

const sourcesUrl = apiUrl(`/v1/notebooks/${nbIds.notebook}/sources`)
const sourceUrl = (sourceId: string) => `${sourcesUrl}/${sourceId}`

describe("NoteEditor", () => {
  describe("a new note", () => {
    it("creates a note source and returns to the chat", async () => {
      let body: unknown = null
      server.use(
        http.post(sourcesUrl, async ({ request }) => {
          body = await request.json()
          return HttpResponse.json({ items: [], rejected: [] }, { status: 201 })
        }),
      )
      const { user, actions } = renderNotebook(<NoteEditor notebookId={nbIds.notebook} />)
      expect(screen.getByRole("button", { name: "Save note" })).toBeDisabled()

      await user.click(screen.getByLabelText("Title"))
      await user.paste("Exam checklist")
      await user.click(screen.getByLabelText("Note"))
      await user.paste("## Topics\n\n- Calvin cycle")
      await user.click(screen.getByRole("button", { name: "Save note" }))

      await waitFor(() =>
        expect(body).toEqual({
          items: [{ kind: "note", title: "Exam checklist", body_md: "## Topics\n\n- Calvin cycle" }],
        }),
      )
      await waitFor(() => expect(actions.closeViewer).toHaveBeenCalledTimes(1))
    })

    it("falls back to a default title", async () => {
      let body: { items?: { title?: string }[] } | null = null
      server.use(
        http.post(sourcesUrl, async ({ request }) => {
          body = (await request.json()) as typeof body
          return HttpResponse.json({ items: [], rejected: [] }, { status: 201 })
        }),
      )
      const { user } = renderNotebook(<NoteEditor notebookId={nbIds.notebook} />)

      await user.click(screen.getByLabelText("Note"))
      await user.paste("Just a thought")
      await user.click(screen.getByRole("button", { name: "Save note" }))

      await waitFor(() => expect(body?.items?.[0]?.title).toBe("Untitled note"))
    })

    it("shows the reason when the backend refuses the note", async () => {
      server.use(
        http.post(sourcesUrl, () =>
          HttpResponse.json(
            {
              items: [],
              rejected: [
                {
                  index: 0,
                  error: { type: "notebooks/source-limit", title: "Limit", message_key: "x", params: {} },
                },
              ],
            },
            { status: 201 },
          ),
        ),
      )
      const { user, actions } = renderNotebook(<NoteEditor notebookId={nbIds.notebook} />)

      await user.click(screen.getByLabelText("Note"))
      await user.paste("Text")
      await user.click(screen.getByRole("button", { name: "Save note" }))

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "This notebook has reached the limit of sources or text.",
      )
      expect(actions.closeViewer).not.toHaveBeenCalled()
    })

    it("goes back with Back and Cancel", async () => {
      const { user, actions } = renderNotebook(<NoteEditor notebookId={nbIds.notebook} />)

      await user.click(screen.getByRole("button", { name: "Back to chat" }))
      await user.click(screen.getByRole("button", { name: "Cancel" }))

      expect(actions.closeViewer).toHaveBeenCalledTimes(2)
    })
  })

  describe("editing a source", () => {
    it("loads the title and text and saves both", async () => {
      let body: unknown = null
      server.use(
        http.patch(sourceUrl(nbIds.sourceText), async ({ request }) => {
          body = await request.json()
          return HttpResponse.json({ ...sourceText, title: "Friday test" })
        }),
      )
      const { user, actions } = renderNotebook(<NoteEditor notebookId={nbIds.notebook} sourceId={nbIds.sourceText} />)

      const title = await screen.findByLabelText("Title")
      expect(title).toHaveValue("My notes")
      const text = screen.getByLabelText("Note") as HTMLTextAreaElement
      expect(text.value).toContain("Remember: light reactions")
      await user.clear(title)
      await user.click(title)
      await user.paste("Friday test")
      await user.clear(text)
      await user.click(text)
      await user.paste("Equation and chloroplast.")
      await user.click(screen.getByRole("button", { name: "Save note" }))

      await waitFor(() => expect(body).toEqual({ title: "Friday test", body_md: "Equation and chloroplast." }))
      await waitFor(() => expect(actions.openSource).toHaveBeenCalledWith(nbIds.sourceText))
    })

    it("shows a note with citations read-only until the citations are removed", async () => {
      let body: unknown = null
      server.use(
        http.get(sourceUrl(nbIds.sourceText), () =>
          HttpResponse.json({
            ...sourceDetailOf(sourceText),
            kind: "note",
            body_md: "Sugar is made from CO2 ⟦1⟧.",
            citations: [citation1],
          }),
        ),
        http.patch(sourceUrl(nbIds.sourceText), async ({ request }) => {
          body = await request.json()
          return HttpResponse.json(sourceText)
        }),
      )
      const { user } = renderNotebook(<NoteEditor notebookId={nbIds.notebook} sourceId={nbIds.sourceText} />)

      expect(await screen.findByRole("button", { name: /Source 1: Biology 10\.pdf/ })).toBeInTheDocument()
      expect(screen.queryByLabelText("Note")).not.toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Remove citations and edit" }))
      const text = (await screen.findByLabelText("Note")) as HTMLTextAreaElement
      expect(text.value).toBe("Sugar is made from CO2.")
      expect(screen.queryByRole("button", { name: /Source 1/ })).not.toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Save note" }))

      await waitFor(() => expect(body).toEqual({ title: "My notes", body_md: "Sugar is made from CO2." }))
    })

    it("shows an error with a retry when the source cannot be loaded", async () => {
      server.use(http.get(sourceUrl(nbIds.sourceText), () => problem(500, "common/internal", "Boom"), { once: true }))
      const { user } = renderNotebook(<NoteEditor notebookId={nbIds.notebook} sourceId={nbIds.sourceText} />)

      expect(screen.getByRole("status", { name: "Loading…" })).toBeInTheDocument()
      await user.click(await screen.findByRole("button", { name: "Try again" }))

      expect(await screen.findByLabelText("Title")).toHaveValue("My notes")
    })
  })
})
