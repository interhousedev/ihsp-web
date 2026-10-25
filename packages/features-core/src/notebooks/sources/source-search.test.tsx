import { describe, expect, it } from "bun:test"
import type { SourceItem } from "@ihsp/api"
import {
  apiUrl,
  courseWorkspaceReadOnly,
  nbIds,
  notebookDetail,
  notebookEmptyDetail,
  seedNotebookSource,
  server,
  setCourseWorkspaceReadOnly,
  sourceFile,
} from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourcesPanel } from "./sources-panel"

allowSlowRenders()

const LATIN: SourceItem = {
  ...sourceFile,
  id: nbIds.sourceStale,
  title: "Oʻzbekiston tarixi.pdf",
  position: 4,
}
const CYRILLIC: SourceItem = {
  ...sourceFile,
  id: nbIds.sourceFailed,
  title: "Ўзбек тили дарслиги.pdf",
  position: 5,
}

function renderPanel(notebook = notebookDetail) {
  return renderNotebook(<SourcesPanel notebook={notebook} />, { actions: { notebookId: notebook.id } })
}

type View = ReturnType<typeof renderPanel>

const openSearch = async (user: View["user"]) => {
  await user.click(await screen.findByRole("button", { name: "Search sources" }))
  return screen.findByRole("textbox", { name: "Search sources" })
}

const titleSearch = async (user: View["user"], text: string) => {
  const field = await openSearch(user)
  await user.click(field)
  await user.paste(text)
  return field
}

/** `waitFor` on a boolean: a failed element matcher prints a lot in happy-dom. */
function until(check: () => boolean) {
  return waitFor(() => {
    if (!check()) throw new Error("condition not met yet")
  })
}

const row = (title: string) => screen.queryByRole("checkbox", { name: title })

describe("Sources title search", () => {
  describe("the field", () => {
    it("opens from the toolbar with the focus in it and closes from the same button", async () => {
      const { user } = renderPanel()
      await screen.findByRole("checkbox", { name: "Biology 10.pdf" })
      const toggle = screen.getByRole("button", { name: "Search sources" })
      expect(toggle).toHaveAttribute("aria-expanded", "false")

      await user.click(toggle)

      const field = await screen.findByRole("textbox", { name: "Search sources" })
      expect(field).toHaveFocus()
      expect(toggle).toHaveAttribute("aria-expanded", "true")

      await user.click(toggle)

      expect(screen.queryByRole("textbox", { name: "Search sources" })).not.toBeInTheDocument()
      expect(toggle).toHaveAttribute("aria-expanded", "false")
    })

    it("clears and closes on Escape and gives the focus back to the search button", async () => {
      const { user } = renderPanel()
      await titleSearch(user, "biology")
      await until(() => row("My notes") === null)

      await user.keyboard("{Escape}")

      expect(screen.queryByRole("textbox", { name: "Search sources" })).not.toBeInTheDocument()
      expect(row("My notes")).toBeInTheDocument()
      expect(row("Lesson 5: Photosynthesis")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Search sources" })).toHaveFocus()
    })

    it("has a clear button that empties the field and keeps it open", async () => {
      const { user } = renderPanel()
      const field = await titleSearch(user, "biology")
      await until(() => row("My notes") === null)

      await user.click(screen.getByRole("button", { name: "Clear search" }))

      expect(field).toHaveValue("")
      expect(field).toHaveFocus()
      await until(() => row("My notes") !== null)
      expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument()
    })
  })

  describe("filtering the list", () => {
    it("shows only the sources whose title contains every word, in the groups", async () => {
      const { user } = renderPanel()

      await titleSearch(user, "lesson photosynthesis")

      await until(() => row("Biology 10.pdf") === null)
      expect(row("Lesson 5: Photosynthesis")).toBeInTheDocument()
      expect(row("My notes")).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /Files\s*\(/i })).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Lesson materials\s*\(1\)/i })).toBeInTheDocument()
    })

    it("filters a flat list too", async () => {
      const seed = (item: SourceItem) =>
        seedNotebookSource({ ...item, notebook_id: nbIds.notebookEmpty }, nbIds.notebookEmpty)
      seed({ ...sourceFile, id: nbIds.sourceStale, title: "Chemistry.pdf", position: 1 })
      seed({ ...sourceFile, id: nbIds.sourceFailed, title: "Physics.pdf", position: 2 })
      const { user } = renderPanel(notebookEmptyDetail)
      await screen.findByRole("checkbox", { name: "Chemistry.pdf" })
      expect(screen.queryByRole("button", { name: /Files\s*\(/i })).not.toBeInTheDocument()

      await titleSearch(user, "phys")

      await until(() => row("Chemistry.pdf") === null)
      expect(row("Physics.pdf")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /Files\s*\(/i })).not.toBeInTheDocument()
    })

    it("tells the screen reader how many sources matched", async () => {
      const { user } = renderPanel()

      await titleSearch(user, "lesson")

      expect(await screen.findByText("1 source found")).toBeInTheDocument()
    })

    it("says nothing was found for the query", async () => {
      const { user } = renderPanel()

      await titleSearch(user, "zzzz")

      expect(await screen.findByText("Nothing found for «zzzz»")).toBeInTheDocument()
      expect(row("Biology 10.pdf")).not.toBeInTheDocument()
    })

    it("works for the readers of a course workspace", async () => {
      setCourseWorkspaceReadOnly(true)
      const { user } = renderPanel(courseWorkspaceReadOnly)
      await screen.findByRole("checkbox", { name: "Biology 10.pdf" })

      await user.click(screen.getByRole("button", { name: "Search sources" }))
      await user.click(await screen.findByRole("textbox", { name: "Search sources" }))
      await user.paste("lesson")

      await until(() => row("Biology 10.pdf") === null)
      expect(row("Lesson 5: Photosynthesis")).toBeInTheDocument()
    })
  })

  describe("Uzbek in two scripts", () => {
    it("finds a Latin title with a Cyrillic query", async () => {
      seedNotebookSource(LATIN)
      seedNotebookSource(CYRILLIC)
      const { user } = renderPanel()
      await screen.findByRole("checkbox", { name: LATIN.title })

      await titleSearch(user, "ўзбекистон")

      await until(() => row("Biology 10.pdf") === null)
      expect(row(LATIN.title)).toBeInTheDocument()
      expect(row(CYRILLIC.title)).not.toBeInTheDocument()
    })

    it("finds a Cyrillic title with a Latin query", async () => {
      seedNotebookSource(LATIN)
      seedNotebookSource(CYRILLIC)
      const { user } = renderPanel()
      await screen.findByRole("checkbox", { name: CYRILLIC.title })

      await titleSearch(user, "tili darsligi")

      await until(() => row("Biology 10.pdf") === null)
      expect(row(CYRILLIC.title)).toBeInTheDocument()
      expect(row(LATIN.title)).not.toBeInTheDocument()
    })

    it("does not care which apostrophe is typed", async () => {
      seedNotebookSource(LATIN)
      const { user } = renderPanel()
      const field = await titleSearch(user, "oʻzbek")
      await until(() => row("Biology 10.pdf") === null)

      for (const variant of ["o'zbek", "o‘zbek", "o’zbek", "oʼzbek", "o`zbek"]) {
        await user.clear(field)
        await user.paste(variant)
        await until(() => row("Biology 10.pdf") === null && row(LATIN.title) !== null)
      }
    })
  })

  describe("the checkboxes while searching", () => {
    it("Select all acts on the sources that are shown", async () => {
      const bodies: unknown[] = []
      server.use(
        http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/select`), async ({ request }) => {
          bodies.push(await request.json())
          return HttpResponse.json([])
        }),
      )
      const { user } = renderPanel()
      await titleSearch(user, "biology")
      await until(() => row("My notes") === null)

      await user.click(screen.getByRole("checkbox", { name: "Select all sources" }))

      await waitFor(() => expect(bodies).toEqual([{ selected: false, ids: [nbIds.sourceFile] }]))
    })
  })
})
