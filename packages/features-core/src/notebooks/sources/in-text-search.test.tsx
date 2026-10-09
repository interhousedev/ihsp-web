import { describe, expect, it } from "bun:test"
import {
  apiUrl,
  courseWorkspaceReadOnly,
  nbIds,
  notebookDetail,
  passageId,
  problem,
  server,
  setCourseWorkspaceReadOnly,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourcesPanel } from "./sources-panel"

allowSlowRenders()

const searchUrl = (notebookId: string = nbIds.notebook) => apiUrl(`/v1/notebooks/${notebookId}/search`)

function renderPanel(notebook = notebookDetail) {
  return renderNotebook(<SourcesPanel notebook={notebook} />, { actions: { notebookId: notebook.id } })
}

type View = ReturnType<typeof renderPanel>

/** Opens the search field and pastes the query. */
async function search(user: View["user"], text: string) {
  await user.click(await screen.findByRole("button", { name: "Search sources" }))
  await user.click(await screen.findByRole("textbox", { name: "Search sources" }))
  await user.paste(text)
}

/** The `q` of every `GET …/search` request (the default handler still answers). */
function recordSearches(notebookId: string = nbIds.notebook) {
  const queries: string[] = []
  const listener = ({ request }: { request: Request }) => {
    if (request.url.startsWith(searchUrl(notebookId))) queries.push(new URL(request.url).searchParams.get("q") ?? "")
  }
  server.events.on("request:start", listener)
  return { queries, stop: () => server.events.removeListener("request:start", listener) }
}

/** The group once its hits are in (while the search runs it only holds a "Searching…" row). */
async function inTextGroup() {
  const group = await screen.findByRole("region", { name: "In the text" })
  await waitFor(() => {
    if (within(group).queryAllByRole("button").length === 0) throw new Error("no hits yet")
  })
  return group
}

describe("Sources full-text search", () => {
  it("shows an In the text group with the sources whose passages contain the word", async () => {
    const { user } = renderPanel()

    await search(user, "calvin")

    const group = await inTextGroup()
    expect(within(group).getByText("Biology 10.pdf")).toBeInTheDocument()
    expect(within(group).getAllByRole("button")).toHaveLength(1)
    expect(within(group).getByRole("button", { name: /The Calvin cycle takes place in the stroma/ })).toBeInTheDocument()
    // No title contains the word, so the list itself is empty and no "Nothing found" line appears.
    expect(screen.queryByText("Nothing found for «calvin»")).not.toBeInTheDocument()
  })

  it("marks the typed words in the snippets", async () => {
    const { user } = renderPanel()

    await search(user, "calvin stroma")

    const group = await inTextGroup()
    const marked = [...group.querySelectorAll("mark")].map((mark) => mark.textContent)
    expect(marked).toEqual(["Calvin", "stroma"])
  })

  it("lists up to three hits per source, each with its page", async () => {
    const { user } = renderPanel()

    await search(user, "the")

    const group = await inTextGroup()
    const blocks = within(group).getAllByRole("list", { name: /./ })
    for (const block of blocks) expect(within(block).getAllByRole("button").length).toBeLessThanOrEqual(3)
    expect(within(group).getAllByText(/Page \d/).length).toBeGreaterThan(0)
  })

  it("opens the viewer at the passage when a hit is clicked", async () => {
    const { user, actions } = renderPanel()
    await search(user, "calvin")

    await user.click(await screen.findByRole("button", { name: /The Calvin cycle takes place in the stroma/ }))

    expect(actions.openSource).toHaveBeenCalledWith(nbIds.sourceFile, passageId(1, 5))
  })

  it("shows the titles that match first and the text hits under them", async () => {
    const { user } = renderPanel()

    await search(user, "photosynthesis")

    const group = await inTextGroup()
    expect(screen.getByRole("checkbox", { name: "Lesson 5: Photosynthesis" })).toBeInTheDocument()
    expect(within(group).getByText("Biology 10.pdf")).toBeInTheDocument()
    const title = screen.getByRole("checkbox", { name: "Lesson 5: Photosynthesis" })
    expect(title.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("shows a quiet Searching row while it waits and nothing for a failure", async () => {
    const { promise: gate, resolve } = Promise.withResolvers<void>()
    server.use(
      http.get(searchUrl(), async () => {
        await gate
        return problem(422, "common/validation-failed", "The query is too short")
      }),
    )
    const { user } = renderPanel()

    await search(user, "calvin")

    expect(await screen.findByText("Searching in the text…")).toBeInTheDocument()
    resolve()
    await waitFor(() => expect(screen.queryByText("Searching in the text…")).not.toBeInTheDocument())
    expect(screen.queryByRole("region", { name: "In the text" })).not.toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    // Nothing matches by title either, so the panel says so.
    expect(await screen.findByText("Nothing found for «calvin»")).toBeInTheDocument()
  })

  it("leaves the group out when the rate limit is hit", async () => {
    server.use(http.get(searchUrl(), () => problem(429, "common/rate-limited", "Too many requests")))
    const { user } = renderPanel()

    await search(user, "lesson")

    expect(await screen.findByRole("checkbox", { name: "Lesson 5: Photosynthesis" })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("region", { name: "In the text" })).not.toBeInTheDocument())
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("sends one request after typing pauses, not one per key", async () => {
    const searches = recordSearches()
    const { user } = renderPanel()
    await user.click(await screen.findByRole("button", { name: "Search sources" }))
    await user.click(await screen.findByRole("textbox", { name: "Search sources" }))

    await user.keyboard("calvin")
    await inTextGroup()

    expect(searches.queries).toEqual(["calvin"])
    searches.stop()
  })

  it("does not search the text for a single character", async () => {
    const searches = recordSearches()
    const { user } = renderPanel()

    await search(user, "c")
    await new Promise((resolve) => setTimeout(resolve, 450))

    expect(searches.queries).toEqual([])
    expect(screen.queryByRole("region", { name: "In the text" })).not.toBeInTheDocument()
    searches.stop()
  })

  it("keeps an answer for the same words instead of asking again", async () => {
    const searches = recordSearches()
    const { user } = renderPanel()
    await search(user, "calvin")
    await inTextGroup()

    await user.click(screen.getByRole("button", { name: "Clear search" }))
    await user.paste("calvin")
    await inTextGroup()

    expect(searches.queries).toEqual(["calvin"])
    searches.stop()
  })

  it("is also there for a reader of a course workspace", async () => {
    setCourseWorkspaceReadOnly(true)
    const { user, actions } = renderPanel(courseWorkspaceReadOnly)
    await screen.findByText("You can read this workspace but not change it.")

    await search(user, "stroma")

    const group = await inTextGroup()
    await user.click(within(group).getAllByRole("button")[0] as HTMLElement)
    expect(actions.openSource).toHaveBeenCalledTimes(1)
  })
})
