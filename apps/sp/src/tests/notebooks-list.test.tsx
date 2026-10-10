/** WEB-31, WEB-32: the list of notebooks: cards, search, New notebook, and the Pin / Rename / Delete menu of a card. */
import { describe, expect, test } from "bun:test"
import { apiUrl, nbIds, notebookEmptyDetail, notebookPinnedDetail, problem, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { NotebooksPage } from "../features/notebooks/components/notebooks-page"
import { configureTests } from "./helpers"
import { renderNotebooksSp } from "./notebooks-helpers"

configureTests()

const PATH = "/notebooks/"

async function renderList() {
  const result = renderNotebooksSp(<NotebooksPage />, { route: PATH })
  await screen.findByRole("link", { name: /Photosynthesis/ })
  return result
}

/** Whether a link with this name is on screen (a boolean, so that a failing expectation does not print the DOM). */
function isShown(name: RegExp): boolean {
  return screen.queryByRole("link", { name }) !== null
}

function cardOf(title: string | RegExp): HTMLElement {
  const link = screen.getByRole("link", { name: title })
  const item = link.closest("li")
  if (!item) throw new Error("The card has no list item")
  return item
}

async function openCardMenu(user: Awaited<ReturnType<typeof renderList>>["user"], title: string, item: string) {
  await user.click(screen.getByRole("button", { name: `Actions for “${title}”` }))
  await user.click(await screen.findByRole("menuitem", { name: item }))
}

describe("notebooks list", () => {
  test("shows the heading, the search field and a card for every notebook, pinned first", async () => {
    await renderList()

    expect(screen.getByRole("heading", { name: "Notebooks" })).toBeInTheDocument()
    expect(screen.getByRole("searchbox", { name: "Search notebooks" })).toBeInTheDocument()
    const titles = screen
      .getAllByRole("link")
      .map((link) => link.textContent ?? "")
      .filter((text) => /World history|Photosynthesis|Untitled notebook/.test(text))
    expect(titles[0]).toContain("World history")
    expect(titles.some((text) => text.includes("Photosynthesis"))).toBe(true)
    expect(titles.some((text) => text.includes("Untitled notebook"))).toBe(true)
  })

  test("a card has the emoji, the title, the number of sources and links to the notebook", async () => {
    await renderList()

    const card = cardOf(/Photosynthesis/)
    expect(card).toHaveTextContent("🌱")
    expect(card).toHaveTextContent("3 sources")
    // next/link drops the trailing slash outside the app (no `trailingSlash` setting in tests).
    expect(within(card).getByRole("link").getAttribute("href")).toMatch(
      new RegExp(`^/notebooks/view/?\\?id=${nbIds.notebook}$`),
    )
    expect(cardOf(/Untitled notebook/)).toHaveTextContent("📓")
    expect(cardOf(/Untitled notebook/)).toHaveTextContent("0 sources")
  })

  test("a pinned notebook says so", async () => {
    await renderList()

    expect(within(cardOf(/World history/)).getByRole("img", { name: "Pinned" })).toBeInTheDocument()
    expect(within(cardOf(/Photosynthesis/)).queryByRole("img", { name: "Pinned" })).not.toBeInTheDocument()
  })

  test("shows placeholders while the list loads", () => {
    renderNotebooksSp(<NotebooksPage />, { route: PATH })

    expect(screen.getByRole("heading", { name: "Notebooks" })).toBeInTheDocument()
    expect(isShown(/Photosynthesis/)).toBe(false)
  })

  test("asks the server for the typed text and says when nothing matches", async () => {
    const queries: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/notebooks"), ({ request }) => {
        const q = new URL(request.url).searchParams.get("q")
        queries.push(q)
        return HttpResponse.json({ items: [], next_cursor: null })
      }),
    )
    const { user } = renderNotebooksSp(<NotebooksPage />, { route: PATH })
    await screen.findByText("No notebooks yet.")

    await user.type(screen.getByRole("searchbox", { name: "Search notebooks" }), "zzz")

    expect(await screen.findByText("No notebooks match “zzz”.")).toBeInTheDocument()
    expect(queries[0]).toBeNull()
    expect(queries.at(-1)).toBe("zzz")
  })

  test("search narrows the list to the notebooks whose title matches", async () => {
    const { user } = await renderList()

    await user.type(screen.getByRole("searchbox", { name: "Search notebooks" }), "history")

    // The pinned notebook is on screen all along; the others leave once the server has answered.
    await waitFor(() => expect(isShown(/Photosynthesis/)).toBe(false))
    expect(isShown(/World history/)).toBe(true)
    expect(isShown(/Untitled notebook/)).toBe(false)
  })

  test("an empty list invites to create the first notebook", async () => {
    server.use(http.get(apiUrl("/v1/notebooks"), () => HttpResponse.json({ items: [], next_cursor: null })))
    renderNotebooksSp(<NotebooksPage />, { route: PATH })

    expect(await screen.findByText("No notebooks yet.")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "New notebook" }).length).toBeGreaterThan(0)
  })

  test("shows the error with Try again, and loads the list on retry", async () => {
    let failing = true
    server.use(
      http.get(apiUrl("/v1/notebooks"), () => {
        if (failing) return problem(500, "server/error", "Boom")
        return HttpResponse.json({ items: [], next_cursor: null })
      }),
    )
    const { user } = renderNotebooksSp(<NotebooksPage />, { route: PATH })
    const retry = await screen.findByRole("button", { name: "Try again" })

    failing = false
    await user.click(retry)

    expect(await screen.findByText("No notebooks yet.")).toBeInTheDocument()
  })
})

describe("new notebook", () => {
  test("creates an untitled notebook and opens it with the Add sources dialog", async () => {
    const created: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/notebooks"), async ({ request }) => {
        created.push(await request.text())
        return HttpResponse.json({ ...notebookEmptyDetail, id: "nb-new" }, { status: 201 })
      }),
    )
    const { user } = await renderList()

    const tile = within(screen.getByRole("list")).getByRole("button", { name: "New notebook" })
    await user.click(tile)

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith("/notebooks/view/?id=nb-new&add=1"))
    expect(created).toHaveLength(1)
  })

  test("the button in the heading creates a notebook too", async () => {
    const { user } = await renderList()

    const buttons = screen.getAllByRole("button", { name: "New notebook" })
    await user.click(buttons[0]!)

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledTimes(1))
    expect(String(testRouter.push.mock.calls[0]?.[0])).toMatch(/^\/notebooks\/view\/\?id=.+&add=1$/)
  })

  test("shows the error and stays on the list when creating fails", async () => {
    server.use(http.post(apiUrl("/v1/notebooks"), () => problem(500, "server/error", "Boom")))
    const { user } = await renderList()

    await user.click(within(screen.getByRole("list")).getByRole("button", { name: "New notebook" }))

    expect((await screen.findAllByRole("alert")).length).toBeGreaterThan(0)
    expect(testRouter.push).not.toHaveBeenCalled()
  })
})

describe("card menu", () => {
  test("pins a notebook", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(apiUrl(`/v1/notebooks/${nbIds.notebook}`), async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        bodies.push(body)
        return HttpResponse.json({ ...notebookPinnedDetail, id: nbIds.notebook, ...body })
      }),
    )
    const { user } = await renderList()

    await openCardMenu(user, "Photosynthesis", "Pin")

    await waitFor(() => expect(bodies).toEqual([{ pinned: true }]))
  })

  test("offers Unpin for a pinned notebook and sends pinned false", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(apiUrl(`/v1/notebooks/${nbIds.notebookPinned}`), async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        bodies.push(body)
        return HttpResponse.json({ ...notebookPinnedDetail, ...body })
      }),
    )
    const { user } = await renderList()

    await openCardMenu(user, "World history", "Unpin")

    await waitFor(() => expect(bodies).toEqual([{ pinned: false }]))
  })

  test("renames a notebook in a dialog that starts from the current title", async () => {
    const { user } = await renderList()
    await openCardMenu(user, "Photosynthesis", "Rename")
    const dialog = await screen.findByRole("dialog", { name: "Rename notebook" })
    const field = within(dialog).getByRole("textbox", { name: "Name" })
    expect(field).toHaveValue("Photosynthesis")

    await user.clear(field)
    await user.paste("Plants")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(await screen.findByRole("link", { name: /Plants/ })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("dialog") === null).toBe(true))
    expect(isShown(/Photosynthesis/)).toBe(false)
  })

  test("does not save an empty or unchanged name", async () => {
    let patches = 0
    server.use(
      http.patch(apiUrl(`/v1/notebooks/${nbIds.notebook}`), () => {
        patches += 1
        return HttpResponse.json(notebookPinnedDetail)
      }),
    )
    const { user } = await renderList()
    await openCardMenu(user, "Photosynthesis", "Rename")
    const dialog = await screen.findByRole("dialog", { name: "Rename notebook" })
    await user.clear(within(dialog).getByRole("textbox", { name: "Name" }))
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled()
    await user.paste("Photosynthesis")

    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(screen.queryByRole("dialog") === null).toBe(true))
    expect(patches).toBe(0)
  })

  test("keeps the rename dialog open and shows the error when saving fails", async () => {
    server.use(http.patch(apiUrl(`/v1/notebooks/${nbIds.notebook}`), () => problem(500, "server/error", "Boom")))
    const { user } = await renderList()
    await openCardMenu(user, "Photosynthesis", "Rename")
    const dialog = await screen.findByRole("dialog", { name: "Rename notebook" })
    await user.clear(within(dialog).getByRole("textbox", { name: "Name" }))
    await user.paste("Plants")

    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(await within(dialog).findByRole("alert")).toBeInTheDocument()
    expect(screen.getByRole("dialog", { name: "Rename notebook" })).toBeInTheDocument()
  })

  test("cancel closes the rename dialog", async () => {
    const { user } = await renderList()
    await openCardMenu(user, "Photosynthesis", "Rename")

    await user.click(
      within(await screen.findByRole("dialog", { name: "Rename notebook" })).getByRole("button", { name: "Cancel" }),
    )

    await waitFor(() => expect(screen.queryByRole("dialog") === null).toBe(true))
  })

  test("deletes a notebook after a confirmation, and it leaves the list", async () => {
    const { user } = await renderList()
    await openCardMenu(user, "Photosynthesis", "Delete")
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Delete this notebook?")).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(isShown(/Photosynthesis/)).toBe(false))
    expect(screen.queryByRole("alertdialog") === null).toBe(true)
    expect(screen.getByRole("link", { name: /World history/ })).toBeInTheDocument()
  })

  test("keeps the notebook when the confirmation is cancelled", async () => {
    let deleted = 0
    server.use(
      http.delete(apiUrl(`/v1/notebooks/${nbIds.notebook}`), () => {
        deleted += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = await renderList()
    await openCardMenu(user, "Photosynthesis", "Delete")

    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog") === null).toBe(true))
    expect(deleted).toBe(0)
    expect(screen.getByRole("link", { name: /Photosynthesis/ })).toBeInTheDocument()
  })

  test("keeps the dialog and shows the error when deleting fails", async () => {
    server.use(http.delete(apiUrl(`/v1/notebooks/${nbIds.notebook}`), () => problem(500, "server/error", "Boom")))
    const { user } = await renderList()
    await openCardMenu(user, "Photosynthesis", "Delete")

    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }))

    expect(await within(await screen.findByRole("alertdialog")).findByRole("alert")).toBeInTheDocument()
    // The open dialog hides the page from assistive technology, but the card is still there.
    expect(screen.getByRole("link", { name: /Photosynthesis/, hidden: true })).toBeInTheDocument()
  })
})
