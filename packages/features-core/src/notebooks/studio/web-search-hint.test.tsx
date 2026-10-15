import { describe, expect, it } from "bun:test"
import type { ArtifactItem } from "@ihsp/api"
import { apiUrl, artifactGenerating, nbIds, notebookDetail, server } from "@ihsp/test-utils"
import { act, screen, waitFor, within } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourcesPanel } from "../sources/sources-panel"
import { requestWebSearch } from "../sources/web-search-prefill"
import { StudioPanel } from "./studio-panel"

allowSlowRenders()

const ARTIFACTS_URL = apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts`)
const DISCOVER_URL = apiUrl(`/v1/notebooks/${nbIds.notebook}/discover`)
const PLACEHOLDER = "Find new sources on the internet"
const QUERY = "Biology cell division"

/** The server says the sources are thin: the created output carries the web search suggestion. */
function thinSourcesCreate(): void {
  server.use(
    http.post(ARTIFACTS_URL, () => {
      const item: ArtifactItem & { suggest_web_search: { query: string } } = {
        ...artifactGenerating,
        id: "thin-1",
        kind: "quiz",
        status: "queued",
        suggest_web_search: { query: QUERY },
      }
      return HttpResponse.json(item, { status: 202 })
    }),
  )
}

async function openQuiz(user: UserEvent): Promise<HTMLElement> {
  await user.click(await screen.findByRole("button", { name: "Customize Quiz" }))
  return screen.findByRole("dialog", { name: "Customize Quiz" })
}

describe("Studio: not enough material", () => {
  it("shows the web search hint in the dialog after a thin request, and the button opens the web search with the query", async () => {
    thinSourcesCreate()
    const { user, actions } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openQuiz(user)

    await user.click(within(dialog).getByRole("button", { name: "Generate" }))

    expect(await within(dialog).findByText("Not enough material — search the web for sources?")).toBeTruthy()

    await user.click(within(dialog).getByRole("button", { name: "Search the web" }))

    expect(actions.openWebSearch).toHaveBeenCalledTimes(1)
    expect(actions.openWebSearch).toHaveBeenCalledWith(QUERY)
  })

  it("starts nothing by itself: the hint does not send a search", async () => {
    thinSourcesCreate()
    let searches = 0
    server.use(
      http.post(DISCOVER_URL, () => {
        searches += 1
        return HttpResponse.json({}, { status: 500 })
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openQuiz(user)
    await user.click(within(dialog).getByRole("button", { name: "Generate" }))
    await within(dialog).findByText("Not enough material — search the web for sources?")

    expect(searches).toBe(0)
  })
})

describe("Sources: the web search box takes the Studio's query", () => {
  it("fills the Discover box with the query and does not send it", async () => {
    let searches = 0
    server.use(
      http.post(DISCOVER_URL, () => {
        searches += 1
        return HttpResponse.json({}, { status: 500 })
      }),
    )
    renderNotebook(<SourcesPanel notebook={notebookDetail} />, {
      actions: { notebookId: notebookDetail.id },
    })
    const input = await screen.findByRole("textbox", { name: PLACEHOLDER })

    act(() => requestWebSearch(QUERY))

    await waitFor(() => expect((input as HTMLInputElement).value).toBe(QUERY))
    expect(searches).toBe(0)
  })
})
