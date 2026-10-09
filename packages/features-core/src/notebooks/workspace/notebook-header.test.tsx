import { afterAll, describe, expect, it, mock } from "bun:test"
import { apiUrl, nbIds, notebookUsage, notebookUsageLimitReached, problem, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { useNotebook } from "../api"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { paneMocks } from "./test-support"

allowSlowRenders()

// `mock.module` is global to the process: put the real panes back when this file is done.
const realPanes = { ...(await import("./panes")) }
mock.module("./panes", paneMocks)
afterAll(() => {
  mock.module("./panes", () => realPanes)
})
const { NotebookHeader } = await import("./notebook-header")

/** The header fed by the notebook query, so a rename shows up the way it does in the workspace. */
function ConnectedHeader({ id = nbIds.notebook }: { id?: string }) {
  const notebook = useNotebook(id)
  return notebook.data ? <NotebookHeader notebook={notebook.data} /> : null
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  return (await request.json()) as Record<string, unknown>
}

function captureUpdates() {
  const bodies: Record<string, unknown>[] = []
  server.use(
    http.patch(apiUrl(`/v1/notebooks/${nbIds.notebook}`), async ({ request }) => {
      const body = await readJson(request)
      bodies.push(body)
      return HttpResponse.json({ id: nbIds.notebook, ...body })
    }),
  )
  return bodies
}

describe("NotebookHeader", () => {
  it("has a back link to the list, the emoji and the title", async () => {
    renderNotebook(<ConnectedHeader />)

    expect(await screen.findByRole("button", { name: /Photosynthesis/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "All notebooks" })).toHaveAttribute("href", "/notebooks")
    expect(screen.getByRole("button", { name: "Change emoji" })).toHaveTextContent("🌱")
  })

  it("renames from the title: Enter saves", async () => {
    const bodies = captureUpdates()
    const { user } = renderNotebook(<ConnectedHeader />)
    await user.click(await screen.findByRole("button", { name: /Photosynthesis/ }))
    const input = screen.getByRole("textbox", { name: "Rename notebook" })
    expect(input).toHaveValue("Photosynthesis")

    await user.clear(input)
    await user.paste("Cell biology")
    await user.keyboard("{Enter}")

    await waitFor(() => expect(bodies).toEqual([{ title: "Cell biology" }]))
    expect(await screen.findByRole("button", { name: /Cell biology/ })).toBeInTheDocument()
  })

  it("saves a new title when the field loses focus", async () => {
    const bodies = captureUpdates()
    const { user } = renderNotebook(<ConnectedHeader />)
    await user.click(await screen.findByRole("button", { name: /Photosynthesis/ }))
    const input = screen.getByRole("textbox", { name: "Rename notebook" })

    await user.clear(input)
    await user.paste("Plants")
    await user.tab()

    await waitFor(() => expect(bodies).toEqual([{ title: "Plants" }]))
  })

  it("cancels the rename with Escape", async () => {
    const bodies = captureUpdates()
    const { user } = renderNotebook(<ConnectedHeader />)
    await user.click(await screen.findByRole("button", { name: /Photosynthesis/ }))
    const input = screen.getByRole("textbox", { name: "Rename notebook" })

    await user.clear(input)
    await user.paste("Never saved")
    await user.keyboard("{Escape}")

    expect(await screen.findByRole("button", { name: /Photosynthesis/ })).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(bodies).toEqual([])
  })

  it("does not save an empty or unchanged title", async () => {
    const bodies = captureUpdates()
    const { user } = renderNotebook(<ConnectedHeader />)
    await user.click(await screen.findByRole("button", { name: /Photosynthesis/ }))
    await user.clear(screen.getByRole("textbox", { name: "Rename notebook" }))
    await user.keyboard("{Enter}")
    expect(await screen.findByRole("button", { name: /Photosynthesis/ })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Photosynthesis/ }))
    await user.keyboard("{Enter}")

    expect(await screen.findByRole("button", { name: /Photosynthesis/ })).toBeInTheDocument()
    expect(bodies).toEqual([])
  })

  it("shows the error and keeps the old title when the rename fails", async () => {
    server.use(http.patch(apiUrl(`/v1/notebooks/${nbIds.notebook}`), () => problem(500, "server/error", "Boom")))
    const { user } = renderNotebook(<ConnectedHeader />)
    await user.click(await screen.findByRole("button", { name: /Photosynthesis/ }))
    await user.clear(screen.getByRole("textbox", { name: "Rename notebook" }))
    await user.paste("Plants")
    await user.keyboard("{Enter}")

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: /Photosynthesis/ })).toBeInTheDocument())
  })

  it("offers about forty emojis and sets the one that is clicked", async () => {
    const bodies = captureUpdates()
    const { user } = renderNotebook(<ConnectedHeader />)
    await user.click(await screen.findByRole("button", { name: "Change emoji" }))

    const group = await screen.findByRole("group", { name: "Choose an emoji" })
    const options = within(group).getAllByRole("button")
    expect(options).toHaveLength(40)
    await user.click(within(group).getByRole("button", { name: "🧪" }))

    await waitFor(() => expect(bodies).toEqual([{ emoji: "🧪" }]))
    expect(await screen.findByRole("button", { name: "Change emoji" })).toHaveTextContent("🧪")
  })
})

describe("NotebookHeader usage ring", () => {
  it("shows the used share of the larger budget and stays calm below 80 %", async () => {
    renderNotebook(<ConnectedHeader />)

    const ring = await screen.findByRole("button", { name: "Usage" })

    await waitFor(() => expect(ring).toHaveTextContent("10"))
    expect(ring).toHaveAttribute("data-level", "ok")
  })

  it("turns amber from 80 %", async () => {
    server.use(
      http.get(apiUrl("/v1/notebooks/usage"), () =>
        HttpResponse.json({
          ...notebookUsage,
          budget: { ...notebookUsage.budget, day: { ...notebookUsage.budget.day, used: 3_400_000 } },
        }),
      ),
    )
    renderNotebook(<ConnectedHeader />)

    const ring = await screen.findByRole("button", { name: "Usage" })

    await waitFor(() => expect(ring).toHaveAttribute("data-level", "warning"))
    expect(ring).toHaveTextContent("85")
  })

  it("turns red at 100 %", async () => {
    server.use(http.get(apiUrl("/v1/notebooks/usage"), () => HttpResponse.json(notebookUsageLimitReached)))
    renderNotebook(<ConnectedHeader />)

    const ring = await screen.findByRole("button", { name: "Usage" })

    await waitFor(() => expect(ring).toHaveAttribute("data-level", "full"))
    expect(ring).toHaveTextContent("100")
  })

  it("keeps working when the usage request fails", async () => {
    server.use(http.get(apiUrl("/v1/notebooks/usage"), () => problem(500, "server/error", "Boom")))
    renderNotebook(<ConnectedHeader />)

    const ring = await screen.findByRole("button", { name: "Usage" })

    expect(ring).toHaveAttribute("data-level", "ok")
    expect(screen.getByRole("button", { name: /Photosynthesis/ })).toBeInTheDocument()
  })

  it("opens the usage dialog", async () => {
    const { user } = renderNotebook(<ConnectedHeader />)

    await user.click(await screen.findByRole("button", { name: "Usage" }))

    expect(await screen.findByTestId("usage-dialog")).toBeInTheDocument()
  })
})

async function openMenu(user: ReturnType<typeof renderNotebook>["user"], item: string) {
  await user.click(await screen.findByRole("button", { name: "Notebook menu" }))
  await user.click(await screen.findByRole("menuitem", { name: item }))
}

describe("NotebookHeader menu", () => {
  it("opens the chat configuration", async () => {
    const { user } = renderNotebook(<ConnectedHeader />)

    await openMenu(user, "Configure chat")

    expect(await screen.findByTestId("chat-config-dialog")).toBeInTheDocument()
  })

  it("deletes the chat history after a confirmation", async () => {
    let deleted = 0
    server.use(
      http.delete(apiUrl(`/v1/notebooks/${nbIds.notebook}/chat`), () => {
        deleted += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderNotebook(<ConnectedHeader />)

    await openMenu(user, "Delete chat history")
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Delete the chat history of this notebook?")).toBeInTheDocument()
    expect(deleted).toBe(0)
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleted).toBe(1))
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
  })

  it("does nothing when the confirmation is cancelled", async () => {
    let deleted = 0
    server.use(
      http.delete(apiUrl(`/v1/notebooks/${nbIds.notebook}`), () => {
        deleted += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderNotebook(<ConnectedHeader />)

    await openMenu(user, "Delete notebook")
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(deleted).toBe(0)
    expect(testRouter.push).not.toHaveBeenCalled()
  })

  it("deletes the notebook after a confirmation and returns to the list", async () => {
    const { user } = renderNotebook(<ConnectedHeader />)

    await openMenu(user, "Delete notebook")
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Delete this notebook?")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith("/notebooks/"))
  })

  it("keeps the dialog and shows the error when deleting fails", async () => {
    server.use(http.delete(apiUrl(`/v1/notebooks/${nbIds.notebook}`), () => problem(500, "server/error", "Boom")))
    const { user } = renderNotebook(<ConnectedHeader />)

    await openMenu(user, "Delete notebook")
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }))

    expect(await within(await screen.findByRole("alertdialog")).findByRole("alert")).toBeInTheDocument()
    expect(testRouter.push).not.toHaveBeenCalled()
  })
})
