import { describe, expect, it } from "bun:test"
import { keys, type NotebookDetail, type SourceDetail, type SourceItem } from "@ihsp/api"
import {
  apiUrl,
  courseIds,
  courseWorkspaceDetail,
  courseWorkspaceReadOnly,
  createTestQueryClient,
  nbIds,
  notebookDetail,
  notebookSources,
  problem,
  server,
  sourceDetailOf,
  sourceFile,
  sourceText,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourcesPanel } from "./sources-panel"

allowSlowRenders()

const notebookUrl = (path = "") => apiUrl(`/v1/notebooks/${nbIds.notebook}${path}`)

function note(n: number, title: string, overrides: Partial<SourceItem> = {}): SourceItem {
  return {
    ...sourceText,
    id: `0000002c-0000-4000-8000-00000000000${n}`,
    kind: "note",
    title,
    selected: true,
    position: 10 + n,
    ...overrides,
  }
}

const noteOne = note(1, "One")
const noteTwo = note(2, "Two")
const noteThree = note(3, "Three", { selected: false })

const bodies: Record<string, string> = {
  [noteOne.id]: "Plants make sugar ⟦1⟧.",
  [noteTwo.id]: "Light reactions\n\n- ATP\n- NADPH ⟦w1⟧",
  [noteThree.id]: "Not selected.",
}

/** The main notebook with the given notes (listed in the given order, positioned by their `position`). */
function serveNotes(...notes: SourceItem[]) {
  const posted: { combined: unknown[]; selected: unknown[] } = { combined: [], selected: [] }
  server.use(
    http.get(notebookUrl("/sources"), () => HttpResponse.json([...notebookSources, ...notes])),
    http.get(notebookUrl("/sources/:sid"), ({ params }) => {
      const item = notes.find((candidate) => candidate.id === params.sid)
      if (!item) return problem(404, "common/not-found", "Not found")
      const detail: SourceDetail = { ...sourceDetailOf(item), body_md: bodies[item.id] ?? "" }
      return HttpResponse.json(detail)
    }),
    http.post(notebookUrl("/sources"), async ({ request }) => {
      const body = (await request.json()) as { items: unknown[] }
      posted.combined.push(...body.items)
      return HttpResponse.json({ items: [note(9, "Notes · Photosynthesis")], rejected: [] }, { status: 201 })
    }),
    http.post(notebookUrl("/sources/select"), async ({ request }) => {
      posted.selected.push(await request.json())
      return HttpResponse.json([...notebookSources, ...notes])
    }),
  )
  return posted
}

function renderPanel() {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(keys.notebooks.detail(nbIds.notebook), notebookDetail)
  return renderNotebook(<SourcesPanel notebook={notebookDetail} />, { queryClient })
}

function renderWorkspace(notebook: NotebookDetail) {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(keys.notebooks.detail(courseIds.workspace), notebook)
  return renderNotebook(<SourcesPanel notebook={notebook} />, {
    queryClient,
    actions: { notebookId: courseIds.workspace },
  })
}

const isDisabled = (element: HTMLElement) =>
  (element as HTMLButtonElement).disabled === true || element.getAttribute("aria-disabled") === "true"

async function openMenu(user: ReturnType<typeof renderPanel>["user"]) {
  await user.click(await screen.findByRole("button", { name: "More actions for Notes" }))
  return screen.findByRole("menuitem", { name: "Combine selected notes" })
}

async function openDialog(user: ReturnType<typeof renderPanel>["user"]) {
  await user.click(await openMenu(user))
  return screen.findByRole("dialog", { name: "Combine notes" })
}

describe("Combine selected notes: menu", () => {
  it("is in the header of the Notes group and nowhere else", async () => {
    serveNotes(noteOne, noteTwo)
    renderPanel()

    expect(await screen.findByRole("button", { name: "More actions for Notes" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "More actions for Files" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "More actions for Pasted text" })).not.toBeInTheDocument()
  })

  it("is enabled with two selected notes", async () => {
    serveNotes(noteOne, noteTwo, noteThree)
    const { user } = renderPanel()

    const item = await openMenu(user)

    expect(isDisabled(item)).toBe(false)
    expect(screen.queryByText("Select at least two notes to combine them.")).not.toBeInTheDocument()
  })

  it("is disabled with a hint when fewer than two notes are selected", async () => {
    serveNotes(noteOne, { ...noteTwo, selected: false })
    const { user } = renderPanel()

    const item = await openMenu(user)

    expect(isDisabled(item)).toBe(true)
    expect(screen.getByText("Select at least two notes to combine them.")).toBeInTheDocument()
  })

  it("does not count a selected note that is not ready", async () => {
    serveNotes(noteOne, { ...noteTwo, status: "processing" })
    const { user } = renderPanel()

    expect(isDisabled(await openMenu(user))).toBe(true)
  })

  it("is hidden for a read-only member of a course workspace and shown to a writer", async () => {
    const workspaceNotes = http.get(apiUrl(`/v1/notebooks/${courseIds.workspace}/sources`), () =>
      HttpResponse.json([sourceFile, noteOne, noteTwo]),
    )
    server.use(workspaceNotes)
    const writer = renderWorkspace(courseWorkspaceDetail)
    expect(await screen.findByRole("button", { name: "More actions for Notes" })).toBeInTheDocument()
    writer.unmount()

    renderWorkspace(courseWorkspaceReadOnly)
    expect(await screen.findByRole("button", { name: /Notes\s*\(2\)/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "More actions for Notes" })).not.toBeInTheDocument()
  })
})

describe("Combine selected notes: dialog", () => {
  it("opens with the default title, the selected notes in order and the checkbox on", async () => {
    serveNotes(noteTwo, noteOne, noteThree)
    const { user } = renderPanel()

    const dialog = await openDialog(user)

    expect(within(dialog).getByRole("textbox", { name: "Title of the new note" })).toHaveValue("Notes · Photosynthesis")
    const list = within(dialog).getByRole("list", { name: "Notes to combine" })
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["One", "Two"])
    expect(within(dialog).getByRole("checkbox", { name: "Unselect the original notes" })).toBeChecked()
    expect(within(dialog).getByRole("button", { name: "Combine" })).toBeEnabled()
  })

  it("posts one note with the bodies as sections in order, citations stripped, then unselects the originals", async () => {
    const posted = serveNotes(noteTwo, noteOne, noteThree)
    const { user } = renderPanel()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole("button", { name: "Combine" }))

    await waitFor(() => expect(posted.selected).toHaveLength(1))
    expect(posted.combined).toEqual([
      {
        kind: "note",
        title: "Notes · Photosynthesis",
        body_md: "## One\n\nPlants make sugar.\n\n## Two\n\nLight reactions\n\n- ATP\n- NADPH",
      },
    ])
    expect(posted.selected).toEqual([{ selected: false, ids: [noteOne.id, noteTwo.id] }])
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("uses the title the student typed", async () => {
    const posted = serveNotes(noteOne, noteTwo)
    const { user } = renderPanel()
    const dialog = await openDialog(user)
    const field = within(dialog).getByRole("textbox", { name: "Title of the new note" })

    await user.clear(field)
    await user.click(field)
    await user.paste("Exam sheet")
    await user.click(within(dialog).getByRole("button", { name: "Combine" }))

    await waitFor(() => expect(posted.combined).toHaveLength(1))
    expect(posted.combined[0]).toMatchObject({ kind: "note", title: "Exam sheet" })
  })

  it("keeps the originals selected when the checkbox is off", async () => {
    const posted = serveNotes(noteOne, noteTwo)
    const { user } = renderPanel()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole("checkbox", { name: "Unselect the original notes" }))
    await user.click(within(dialog).getByRole("button", { name: "Combine" }))

    await waitFor(() => expect(posted.combined).toHaveLength(1))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(posted.selected).toEqual([])
  })

  it("shows the error inside the dialog and keeps it open when the request fails", async () => {
    const posted = serveNotes(noteOne, noteTwo)
    server.use(
      http.post(notebookUrl("/sources"), () =>
        problem(422, "notebooks/source-limit", "Limit reached", { messageKey: "notebooks.source-limit" }),
      ),
    )
    const { user } = renderPanel()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole("button", { name: "Combine" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "This notebook has reached the limit of sources or text.",
    )
    expect(screen.getByRole("dialog", { name: "Combine notes" })).toBeInTheDocument()
    expect(posted.selected).toEqual([])
    expect(within(dialog).getByRole("button", { name: "Combine" })).toBeEnabled()
  })

  it("shows the error when a note cannot be read and posts nothing", async () => {
    const posted = serveNotes(noteOne, noteTwo)
    server.use(http.get(notebookUrl(`/sources/${noteTwo.id}`), () => problem(404, "notebooks/not-found", "Gone")))
    const { user } = renderPanel()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole("button", { name: "Combine" }))

    expect(await within(dialog).findByRole("alert")).toBeInTheDocument()
    expect(posted.combined).toEqual([])
  })

  it("closes with Cancel without posting anything", async () => {
    const posted = serveNotes(noteOne, noteTwo)
    const { user } = renderPanel()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(posted.combined).toEqual([])
  })
})
