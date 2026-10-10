import { describe, expect, it } from "bun:test"
import { getNotebookLabels, getNotebookSources, postNotebookLabel, putNotebookSourceLabels } from "@ihsp/api"
import {
  apiUrl,
  courseWorkspaceReadOnly,
  nbIds,
  notebookDetail,
  problem,
  server,
  setCourseWorkspaceReadOnly,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourcesPanel } from "./sources-panel"

allowSlowRenders()

function renderPanel(notebook = notebookDetail) {
  return renderNotebook(<SourcesPanel notebook={notebook} />, { actions: { notebookId: notebook.id } })
}

/** `waitFor` on a boolean (a failed element matcher would print the DOM, which is very slow in happy-dom). */
function until(check: () => boolean, timeout = 8000) {
  return waitFor(
    () => {
      if (!check()) throw new Error("condition not met yet")
    },
    { timeout },
  )
}

/** Two topics through the API: "Cells" holds the file and the lesson, "Energy" the file only; the notes stay loose. */
async function seedTopics() {
  const cells = await postNotebookLabel(nbIds.notebook, { name: "Cells", emoji: "🧫" })
  const energy = await postNotebookLabel(nbIds.notebook, { name: "Energy", emoji: "⚡" })
  await putNotebookSourceLabels(nbIds.notebook, nbIds.sourceFile, { label_ids: [cells.id, energy.id] })
  await putNotebookSourceLabels(nbIds.notebook, nbIds.sourceLesson, { label_ids: [cells.id] })
  return { cells, energy }
}

const header = (name: RegExp) => screen.findByRole("button", { name })

describe("Sources panel: topic labels", () => {
  it("groups the sources under their topics, with a count and the group checkbox", async () => {
    await seedTopics()
    renderPanel()

    expect(await header(/^🧫 Cells\s*\(2\)/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^⚡ Energy\s*\(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^No topic\s*\(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Select all in 🧫 Cells" })).toBeChecked()
    // The file has two topics, so it is listed twice.
    expect(screen.getAllByRole("checkbox", { name: "Biology 10.pdf" })).toHaveLength(2)
    expect(screen.queryByRole("button", { name: /Files\s*\(1\)/ })).not.toBeInTheDocument()
  })

  it("keeps the groups by type until the notebook has topics", async () => {
    renderPanel()

    expect(await header(/Files\s*\(1\)/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Group by" })).not.toBeInTheDocument()
  })

  it("switches between topic, type and one list in the Group by menu", async () => {
    await seedTopics()
    const { user } = renderPanel()
    await header(/^🧫 Cells/)

    await user.click(screen.getByRole("button", { name: "Group by" }))
    await user.click(await screen.findByRole("menuitemradio", { name: "Type" }))
    expect(await header(/Files\s*\(1\)/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^🧫 Cells/ })).not.toBeInTheDocument()
    await until(() => screen.queryByRole("menu") === null)

    await user.click(screen.getByRole("button", { name: "Group by" }))
    await user.click(await screen.findByRole("menuitemradio", { name: "None (one list)" }))
    await until(() => screen.queryByRole("button", { name: /Files\s*\(1\)/ }) === null)
    expect(screen.getAllByRole("checkbox", { name: "Biology 10.pdf" })).toHaveLength(1)
  })

  it("renames a topic in place", async () => {
    await seedTopics()
    const { user } = renderPanel()
    await header(/^🧫 Cells/)

    await user.click(screen.getByRole("button", { name: "More actions for 🧫 Cells" }))
    await user.click(await screen.findByRole("menuitem", { name: "Rename label" }))
    const field = await screen.findByRole("textbox", { name: "Label name" })
    await user.clear(field)
    await user.type(field, "Cell biology{Enter}")

    expect(await header(/^🧫 Cell biology\s*\(2\)/)).toBeInTheDocument()
    expect(screen.queryByRole("textbox", { name: "Label name" })).not.toBeInTheDocument()
  })

  it("leaves a topic unchanged on Esc", async () => {
    await seedTopics()
    const { user } = renderPanel()
    await header(/^🧫 Cells/)

    await user.click(screen.getByRole("button", { name: "More actions for 🧫 Cells" }))
    await user.click(await screen.findByRole("menuitem", { name: "Rename label" }))
    await user.type(await screen.findByRole("textbox", { name: "Label name" }), "Other{Escape}")

    expect(await header(/^🧫 Cells\s*\(2\)/)).toBeInTheDocument()
  })

  it("asks before deleting a topic; Cancel keeps it", async () => {
    await seedTopics()
    const { user } = renderPanel()
    await header(/^⚡ Energy/)

    await user.click(screen.getByRole("button", { name: "More actions for ⚡ Energy" }))
    await user.click(await screen.findByRole("menuitem", { name: "Delete label" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent("Delete this label?")
    expect(dialog).toHaveTextContent("The label is removed. Its sources stay in the notebook.")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

    await until(() => screen.queryByRole("alertdialog") === null)
    expect(screen.getByRole("button", { name: /^⚡ Energy\s*\(1\)/ })).toBeInTheDocument()
    expect((await getNotebookLabels(nbIds.notebook)).items).toHaveLength(2)
  })

  it("deletes a topic after the confirmation: its sources stay", async () => {
    await seedTopics()
    const { user } = renderPanel()
    await header(/^⚡ Energy/)

    await user.click(screen.getByRole("button", { name: "More actions for ⚡ Energy" }))
    await user.click(await screen.findByRole("menuitem", { name: "Delete label" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Delete label" }))

    await until(() => screen.queryByRole("button", { name: /^⚡ Energy/ }) === null)
    expect(screen.getByRole("button", { name: /^🧫 Cells\s*\(2\)/ })).toBeInTheDocument()
    const sources = await getNotebookSources(nbIds.notebook)
    expect(sources.find((s) => s.id === nbIds.sourceFile)?.label_ids).toHaveLength(1)
  })

  it("keeps the old name when renaming fails", async () => {
    await seedTopics()
    server.use(
      http.patch(apiUrl(`/v1/notebooks/${nbIds.notebook}/labels/:lid`), () =>
        problem(409, "notebooks/label-exists", "A label with this name exists"),
      ),
    )
    const { user } = renderPanel()
    await header(/^🧫 Cells/)

    await user.click(screen.getByRole("button", { name: "More actions for 🧫 Cells" }))
    await user.click(await screen.findByRole("menuitem", { name: "Rename label" }))
    await user.type(await screen.findByRole("textbox", { name: "Label name" }), "X{Enter}")

    await until(() => screen.queryByRole("textbox", { name: "Label name" }) === null)
    expect(await header(/^🧫 Cells\s*\(2\)/)).toBeInTheDocument()
  })
})

describe("Sources panel: Auto-label", () => {
  it("labels the selected sources in the background and then groups them by topic", async () => {
    const { user } = renderPanel()
    await screen.findByRole("checkbox", { name: "Biology 10.pdf" })

    await user.click(screen.getByRole("button", { name: "Label sources by topic" }))

    const busy = await screen.findByRole("button", { name: "Labelling sources…" })
    expect(busy).toBeDisabled()
    expect(busy).toHaveAttribute("aria-busy", "true")
    expect(
      await screen.findByRole("button", { name: /^🌱 Photosynthesis\s*\(\d\)/ }, { timeout: 8000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^🔄 Calvin cycle/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Label sources by topic" })).toBeEnabled()
  })

  it("cannot start without a selected, ready source", async () => {
    const { user } = renderPanel()
    await screen.findByRole("checkbox", { name: "Biology 10.pdf" })
    await user.click(screen.getByRole("checkbox", { name: "Select all sources" }))
    await until(() => !(screen.getByRole("checkbox", { name: "Biology 10.pdf" }) as HTMLInputElement).checked)

    expect(screen.getByRole("button", { name: "Label sources by topic" })).toBeDisabled()
  })

  it("does not show an error on load for a failed run from before", async () => {
    server.use(
      http.get(apiUrl(`/v1/notebooks/${nbIds.notebook}/labels`), () =>
        HttpResponse.json({ items: [], auto: { status: "failed", finished_at: null, error: "boom" } }),
      ),
    )
    renderPanel()
    await screen.findByRole("checkbox", { name: "Biology 10.pdf" })
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("says so when the run cannot be started", async () => {
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/labels/auto`), () =>
        problem(409, "notebooks/labels-running", "Labelling is already running"),
      ),
    )
    const { user } = renderPanel()
    await screen.findByRole("checkbox", { name: "Biology 10.pdf" })

    await user.click(screen.getByRole("button", { name: "Label sources by topic" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not label the sources. Try again.")
  })
})

describe("Sources panel: topic labels in a read-only course workspace", () => {
  it("shows the topics but offers no Auto-label and no label menu", async () => {
    const workspace = courseWorkspaceReadOnly
    const cells = await postNotebookLabel(workspace.id, { name: "Cells", emoji: "🧫" })
    await putNotebookSourceLabels(workspace.id, nbIds.sourceFile, { label_ids: [cells.id] })
    setCourseWorkspaceReadOnly(true)
    renderPanel(workspace)

    expect(await header(/^🧫 Cells\s*\(1\)/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Label sources by topic" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "More actions for 🧫 Cells" })).not.toBeInTheDocument()
  })
})
