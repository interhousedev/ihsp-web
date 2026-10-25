import { describe, expect, it } from "bun:test"
import type { SourceInput } from "@ihsp/api"
import { apiUrl, ids, nbIds, notebookItems, server, testRouter } from "@ihsp/test-utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, Toaster } from "@ihsp/ui"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { AddToNotebookMenu, AddToNotebookSubMenu } from "./add-to-notebook-menu"

allowSlowRenders()

/** Base UI keeps `pointer-events: none` on the parent of an open sub-menu; real pointers are not blocked by it. */
const loose = userEvent.setup({ pointerEventsCheck: 0 })

const CHAT: SourceInput = { kind: "chat", chat_id: ids.chat }

function renderMenu(input: SourceInput | SourceInput[] = CHAT) {
  return renderNotebook(
    <>
      <AddToNotebookMenu input={input} />
      <Toaster />
    </>,
    { route: "/files/" },
  )
}

describe("AddToNotebookMenu", () => {
  it("lists the recent notebooks and New notebook", async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole("button", { name: "Add to notebook" }))

    const menu = await screen.findByRole("menu")
    expect(await within(menu).findByRole("menuitem", { name: /World history/ })).toBeInTheDocument()
    expect(within(menu).getByRole("menuitem", { name: /Photosynthesis/ })).toBeInTheDocument()
    expect(within(menu).getByRole("menuitem", { name: "New notebook" })).toBeInTheDocument()
    expect(within(menu).getByText("Choose a notebook")).toBeInTheDocument()
  })

  it("offers at most five notebooks", async () => {
    const many = Array.from({ length: 8 }, (_, index) => ({
      ...notebookItems[0],
      id: `0000001e-0000-4000-8000-0000000001${String(index).padStart(2, "0")}`,
      title: `Notebook ${index + 1}`,
    }))
    server.use(http.get(apiUrl("/v1/notebooks"), () => HttpResponse.json({ items: many, next_cursor: null })))
    const { user } = renderMenu()

    await user.click(screen.getByRole("button", { name: "Add to notebook" }))

    const menu = await screen.findByRole("menu")
    await within(menu).findByRole("menuitem", { name: /Notebook 1$/ })
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(6)
    expect(within(menu).queryByRole("menuitem", { name: /Notebook 6/ })).not.toBeInTheDocument()
  })

  it("adds the source, thanks with a toast and opens the notebook from its action", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ items: [{ id: "s-1" }], rejected: [] }, { status: 201 })
      }),
    )
    const { user } = renderMenu()

    await user.click(screen.getByRole("button", { name: "Add to notebook" }))
    await user.click(await screen.findByRole("menuitem", { name: /Photosynthesis/ }))

    expect(await screen.findByText("Added to “Photosynthesis”")).toBeInTheDocument()
    expect(body).toEqual({ items: [CHAT] })
    await user.click(screen.getByRole("button", { name: "Open notebook" }))
    expect(testRouter.push).toHaveBeenCalledWith(`/notebooks/view/?id=${nbIds.notebook}`)
  })

  it("adds several sources in one request", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebookPinned}/sources`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ items: [{ id: "s-1" }, { id: "s-2" }], rejected: [] }, { status: 201 })
      }),
    )
    const inputs: SourceInput[] = [
      { kind: "file", file_id: ids.file },
      { kind: "file", file_id: ids.fileImage },
    ]
    const { user } = renderMenu(inputs)

    await user.click(screen.getByRole("button", { name: "Add to notebook" }))
    await user.click(await screen.findByRole("menuitem", { name: /World history/ }))

    expect(await screen.findByText("Added to “World history”")).toBeInTheDocument()
    expect(body).toEqual({ items: inputs })
  })

  it("says so when the notebook already has the source", async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole("button", { name: "Add to notebook" }))
    await user.click(await screen.findByRole("menuitem", { name: /World history/ }))
    expect(await screen.findByText("Added to “World history”")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Add to notebook" }))
    await user.click(await screen.findByRole("menuitem", { name: /World history/ }))

    expect(await screen.findByText("Already in this notebook")).toBeInTheDocument()
  })

  it("shows the reason when the source cannot be added", async () => {
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources`), () =>
        HttpResponse.json({
          items: [],
          rejected: [
            {
              index: 0,
              error: { type: "notebooks/source-forbidden", title: "Forbidden", message_key: "x", params: {} },
            },
          ],
        }),
      ),
    )
    const { user } = renderMenu()

    await user.click(screen.getByRole("button", { name: "Add to notebook" }))
    await user.click(await screen.findByRole("menuitem", { name: /Photosynthesis/ }))

    expect(await screen.findByText("You cannot add this item as a source.")).toBeInTheDocument()
  })

  it("shows the error when the request fails", async () => {
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources`), () =>
        HttpResponse.json(
          { type: "notebooks/not-found", title: "Not found", status: 404 },
          { status: 404, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderMenu()

    await user.click(screen.getByRole("button", { name: "Add to notebook" }))
    await user.click(await screen.findByRole("menuitem", { name: /Photosynthesis/ }))

    expect(await screen.findByText("This notebook, source or item was not found.")).toBeInTheDocument()
  })

  it("creates a notebook, adds the source to it and opens it", async () => {
    const added: { notebook: string; body: unknown }[] = []
    server.use(
      http.post(apiUrl("/v1/notebooks/:id/sources"), async ({ params, request }) => {
        added.push({ notebook: String(params.id), body: await request.json() })
        return HttpResponse.json({ items: [{ id: "s-1" }], rejected: [] }, { status: 201 })
      }),
    )
    const { user } = renderMenu()

    await user.click(screen.getByRole("button", { name: "Add to notebook" }))
    await user.click(await screen.findByRole("menuitem", { name: "New notebook" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledTimes(1))
    expect(added).toHaveLength(1)
    expect(added[0]?.body).toEqual({ items: [CHAT] })
    expect(testRouter.push).toHaveBeenCalledWith(`/notebooks/view/?id=${added[0]?.notebook}`)
  })

  it("works as a sub-menu inside another dropdown", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ items: [{ id: "s-1" }], rejected: [] }, { status: 201 })
      }),
    )
    const { user } = renderNotebook(
      <>
        <DropdownMenu>
          <DropdownMenuTrigger>Row menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <AddToNotebookSubMenu input={{ kind: "flashcard_set", set_id: ids.flashcardSet }} />
          </DropdownMenuContent>
        </DropdownMenu>
        <Toaster />
      </>,
      { route: "/flashcards/" },
    )

    await user.click(screen.getByRole("button", { name: "Row menu" }))
    await user.click(await screen.findByRole("menuitem", { name: "Add to notebook" }))
    await loose.click(await screen.findByRole("menuitem", { name: /Photosynthesis/ }))

    expect(await screen.findByText("Added to “Photosynthesis”")).toBeInTheDocument()
    expect(body).toEqual({ items: [{ kind: "flashcard_set", set_id: ids.flashcardSet }] })
  })
})
