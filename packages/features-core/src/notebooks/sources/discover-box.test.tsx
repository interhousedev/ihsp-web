import { describe, expect, it } from "bun:test"
import { keys, type DiscoverBody, type DiscoverResponse } from "@ihsp/api"
import {
  apiUrl,
  courseWorkspaceReadOnly,
  discoverResponse,
  nbIds,
  notebookDetail,
  notebookEmptyDetail,
  problem,
  server,
  setCourseWorkspaceReadOnly,
  setWebQuota,
  webQuota,
  webQuotaDisabled,
  webQuotaSpent,
} from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourcesPanel } from "./sources-panel"

allowSlowRenders()

const PLACEHOLDER = "Find new sources on the internet"
const discoverUrl = (notebookId: string = nbIds.notebook) => apiUrl(`/v1/notebooks/${notebookId}/discover`)

function renderPanel(notebook = notebookDetail) {
  return renderNotebook(<SourcesPanel notebook={notebook} />, { actions: { notebookId: notebook.id } })
}

const searchInput = () => screen.findByRole("textbox", { name: PLACEHOLDER })

/** Types a query (pasting is much faster than typing in happy-dom). */
async function typeQuery(user: ReturnType<typeof renderPanel>["user"], text: string) {
  const input = await searchInput()
  await user.click(input)
  await user.paste(text)
}

/** Captures the body of the next Discover request of the empty notebook and answers with the fixture. */
function captureDiscover(response: DiscoverResponse = discoverResponse) {
  const captured: { body: DiscoverBody | null } = { body: null }
  server.use(
    http.post(discoverUrl(notebookEmptyDetail.id), async ({ request }) => {
      captured.body = (await request.json()) as DiscoverBody
      return HttpResponse.json(response)
    }),
  )
  return captured
}

describe("DiscoverBox", () => {
  describe("what it shows", () => {
    it("shows the input, the mode pill with its cost and the quota line in an empty notebook", async () => {
      renderPanel(notebookEmptyDetail)

      expect(await searchInput()).toBeInTheDocument()
      const mode = screen.getByRole("combobox", { name: "Search type" })
      expect(mode).toHaveValue("fast")
      expect(screen.getByRole("option", { name: "Fast search · 1 search" })).toBeInTheDocument()
      expect(screen.getByText("4 of 10 web searches left today")).toBeInTheDocument()
    })

    it("takes the cost of a deep search from the quota", async () => {
      setWebQuota({ ...webQuota, deep_cost: 5 })
      renderPanel(notebookEmptyDetail)

      expect(await screen.findByRole("option", { name: "Deep search · 5 searches" })).toBeInTheDocument()
    })

    it("shows 3 searches for the deep mode with the default quota", async () => {
      renderPanel(notebookEmptyDetail)

      expect(await screen.findByRole("option", { name: "Deep search · 3 searches" })).toBeInTheDocument()
    })

    it("shows only the input once the notebook has sources, and the rest when it is focused", async () => {
      const { user } = renderPanel()
      const input = await searchInput()
      await screen.findByRole("checkbox", { name: "Biology 10.pdf" })

      expect(screen.queryByRole("combobox", { name: "Search type" })).not.toBeInTheDocument()
      expect(screen.queryByText(/web searches left today/)).not.toBeInTheDocument()

      await user.click(input)

      expect(await screen.findByRole("combobox", { name: "Search type" })).toBeInTheDocument()
      expect(screen.getByText("4 of 10 web searches left today")).toBeInTheDocument()
    })
  })

  describe("who sees it", () => {
    it("is hidden when web search is turned off", async () => {
      setWebQuota(webQuotaDisabled)
      const { queryClient } = renderPanel(notebookEmptyDetail)
      await waitFor(() => expect(queryClient.getQueryData(keys.ai.webSearch())).toBeDefined())
      await screen.findByText("Add your first source")

      expect(screen.queryByRole("textbox", { name: PLACEHOLDER })).not.toBeInTheDocument()
    })

    it("is hidden for a reader of a course workspace", async () => {
      setCourseWorkspaceReadOnly(true)
      renderPanel(courseWorkspaceReadOnly)
      await screen.findByText("You can read this workspace but not change it.")

      expect(screen.queryByRole("textbox", { name: PLACEHOLDER })).not.toBeInTheDocument()
    })
  })

  describe("sending a search", () => {
    it("keeps the arrow disabled until the query has two characters", async () => {
      const { user } = renderPanel(notebookEmptyDetail)
      const submit = await screen.findByRole("button", { name: "Search the web" })
      expect(submit).toBeDisabled()

      await typeQuery(user, "a")
      expect(submit).toBeDisabled()

      await user.paste("b")
      expect(submit).toBeEnabled()
    })

    it("sends a fast search and shows the new quota from the response", async () => {
      const captured = captureDiscover({ ...discoverResponse, quota: { ...webQuota, used: 7, remaining: 3 } })
      const { user } = renderPanel(notebookEmptyDetail)
      await typeQuery(user, "  photosynthesis stages ")

      await user.click(screen.getByRole("button", { name: "Search the web" }))

      expect(await screen.findByText("Photosynthesis - Wikipedia")).toBeInTheDocument()
      expect(captured.body).toEqual({ query: "photosynthesis stages", mode: "fast" })
      expect(screen.getByText("3 of 10 web searches left today")).toBeInTheDocument()
    })

    it("sends a deep search when the pill says so", async () => {
      const captured = captureDiscover()
      const { user } = renderPanel(notebookEmptyDetail)
      await typeQuery(user, "calvin cycle")
      await user.selectOptions(screen.getByRole("combobox", { name: "Search type" }), "deep")

      await user.click(screen.getByRole("button", { name: "Search the web" }))

      await waitFor(() => expect(captured.body).toEqual({ query: "calvin cycle", mode: "deep" }))
    })

    it("sends the search when Enter is pressed in the field", async () => {
      const captured = captureDiscover()
      const { user } = renderPanel(notebookEmptyDetail)
      await typeQuery(user, "chloroplast")

      await user.keyboard("{Enter}")

      await waitFor(() => expect(captured.body).toEqual({ query: "chloroplast", mode: "fast" }))
    })
  })

  describe("the quota", () => {
    it("disables the arrow for a deep search the quota cannot pay, but not for a fast one", async () => {
      setWebQuota({ ...webQuota, used: 9, remaining: 1 })
      const { user } = renderPanel(notebookEmptyDetail)
      await typeQuery(user, "calvin cycle")
      const submit = await screen.findByRole("button", { name: "Search the web" })
      expect(submit).toBeEnabled()

      await user.selectOptions(screen.getByRole("combobox", { name: "Search type" }), "deep")

      expect(submit).toBeDisabled()
    })

    it("says when all searches are used, with the reset time, and cannot send", async () => {
      setWebQuota(webQuotaSpent)
      const { user } = renderPanel(notebookEmptyDetail)
      await typeQuery(user, "calvin cycle")

      expect(await screen.findByText(/No web searches left today\. Resets at/)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Search the web" })).toBeDisabled()
    })
  })

  describe("failures", () => {
    it("shows the reset time when the server says there are no searches left, and refreshes the quota", async () => {
      let spent = false
      server.use(
        http.get(apiUrl("/v1/ai/web-search"), () => HttpResponse.json(spent ? webQuotaSpent : webQuota)),
        http.post(discoverUrl(notebookEmptyDetail.id), () => {
          spent = true
          return problem(429, "web-search/quota-exceeded", "No web searches left today", {
            params: { limit: 10, left: 0, needed: 1, resets_at: "2026-10-08T00:00:00Z" },
          })
        }),
      )
      const { user } = renderPanel(notebookEmptyDetail)
      await typeQuery(user, "photosynthesis")

      await user.click(await screen.findByRole("button", { name: "Search the web" }))

      const alert = await screen.findByRole("alert")
      expect(alert).toHaveTextContent(/No web searches left today\. Resets at/)
      await waitFor(() => expect(screen.getAllByText(/No web searches left today\. Resets at/)).toHaveLength(2))
    })

    it("explains a search service that is down and leaves the sources where they are", async () => {
      server.use(
        http.post(discoverUrl(), () => problem(503, "web-search/unavailable", "Web search is not available right now")),
      )
      const { user } = renderPanel()
      await screen.findByRole("checkbox", { name: "Biology 10.pdf" })
      await typeQuery(user, "photosynthesis")

      await user.click(await screen.findByRole("button", { name: "Search the web" }))

      expect(await screen.findByRole("alert")).toHaveTextContent("Web search is not available right now.")
      expect(screen.getByRole("checkbox", { name: "Biology 10.pdf" })).toBeInTheDocument()
    })

    it("falls back to the notebook error text for any other failure", async () => {
      server.use(http.post(discoverUrl(notebookEmptyDetail.id), () => problem(500, "common/internal", "Boom")))
      const { user } = renderPanel(notebookEmptyDetail)
      await typeQuery(user, "photosynthesis")

      await user.click(await screen.findByRole("button", { name: "Search the web" }))

      expect((await screen.findByRole("alert")).textContent?.length).toBeGreaterThan(0)
    })
  })
})
