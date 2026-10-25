import { describe, expect, it } from "bun:test"
import type { AddSourcesResult, SourceInput } from "@ihsp/api"
import {
  apiUrl,
  discoverDeepResponse,
  nbIds,
  notebookDetail,
  notebookEmptyDetail,
  problem,
  seedNotebookSource,
  selectDropdownValue,
  server,
  sourceFile,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourcesPanel } from "./sources-panel"

allowSlowRenders()

const sourcesUrl = (notebookId: string = nbIds.notebook) => apiUrl(`/v1/notebooks/${notebookId}/sources`)
const WIKI = "Photosynthesis - Wikipedia"
const KHAN = "The Calvin cycle (Khan Academy)"
const ADDED = "Chloroplasts (already added)"

function renderPanel(notebook = notebookDetail) {
  return renderNotebook(<SourcesPanel notebook={notebook} />, { actions: { notebookId: notebook.id } })
}

/** Types a query into the Discover box and sends it; waits for the results to appear. */
async function search(user: ReturnType<typeof renderPanel>["user"], options: { deep?: boolean } = {}) {
  const input = await screen.findByRole("textbox", { name: "Find new sources on the internet" })
  await user.click(input)
  await user.paste("photosynthesis stages")
  if (options.deep) await selectDropdownValue(user, screen.getByRole("combobox", { name: "Search type" }), "deep")
  await user.click(screen.getByRole("button", { name: "Search the web" }))
  await screen.findByText(WIKI)
}

/** `waitFor` on a boolean: a failed element matcher prints the whole DOM, which is slow in happy-dom. */
function until(check: () => boolean) {
  return waitFor(() => {
    if (!check()) throw new Error("condition not met yet")
  })
}

/** The bodies of the `POST …/sources` requests of the main notebook (the default handler still answers). */
function recordSourcePosts() {
  const reads: Promise<{ items: SourceInput[] }>[] = []
  const listener = ({ request }: { request: Request }) => {
    if (request.method === "POST" && request.url === sourcesUrl()) {
      reads.push(request.clone().json() as Promise<{ items: SourceInput[] }>)
    }
  }
  server.events.on("request:start", listener)
  return {
    bodies: () => Promise.all(reads),
    stop: () => server.events.removeListener("request:start", listener),
  }
}

const resultsClosed = () => screen.queryByRole("button", { name: "Back to sources" }) === null

function isDisabled(element: HTMLElement) {
  return (element as HTMLButtonElement).disabled === true || element.getAttribute("aria-disabled") === "true"
}

describe("DiscoverResults", () => {
  describe("the list of pages", () => {
    it("replaces the sources until they are closed again", async () => {
      const { user } = renderPanel()
      await screen.findByRole("checkbox", { name: "Biology 10.pdf" })

      await search(user)

      expect(screen.queryByRole("checkbox", { name: "Biology 10.pdf" })).not.toBeInTheDocument()
      expect(screen.getByText("Results for «photosynthesis stages»")).toBeInTheDocument()
      expect(screen.getByText("3 results")).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Back to sources" }))

      expect(await screen.findByRole("checkbox", { name: "Biology 10.pdf" })).toBeInTheDocument()
      expect(screen.queryByText(WIKI)).not.toBeInTheDocument()
    })

    it("shows title, site and reason, the snippet and a link that opens the page safely", async () => {
      const { user } = renderPanel(notebookEmptyDetail)

      await search(user)

      expect(screen.getByRole("checkbox", { name: WIKI })).toBeInTheDocument()
      expect(screen.getByText("uz.wikipedia.org · Defines the process")).toBeInTheDocument()
      expect(screen.getByText(/the process by which plants turn light/)).toBeInTheDocument()
      const link = screen.getByRole("link", { name: `Open «${WIKI}» in a new tab` })
      expect(link).toHaveAttribute("href", "https://uz.wikipedia.org/wiki/Fotosintez")
      expect(link).toHaveAttribute("target", "_blank")
      expect(link.getAttribute("rel")).toContain("noopener")
      expect(link.getAttribute("rel")).toContain("noreferrer")
      expect(link.getAttribute("rel")).toContain("nofollow")
    })

    it("disables a page that is already a source and says so", async () => {
      const { user } = renderPanel(notebookEmptyDetail)

      await search(user)

      expect(isDisabled(screen.getByRole("checkbox", { name: ADDED }))).toBe(true)
      expect(screen.getByText("Already in sources")).toBeInTheDocument()
      expect(isDisabled(screen.getByRole("checkbox", { name: WIKI }))).toBe(false)
    })

    it("shows the searched queries as chips after a deep search", async () => {
      const { user } = renderPanel(notebookEmptyDetail)

      await search(user, { deep: true })

      const queries = screen.getByRole("list", { name: "Searched for" })
      expect(
        within(queries)
          .getAllByRole("listitem")
          .map((item) => item.textContent),
      ).toEqual(discoverDeepResponse.queries)
    })

    it("shows skeleton rows while it searches and says how long a deep search takes", async () => {
      const { promise: gate, resolve } = Promise.withResolvers<void>()
      server.use(
        http.post(apiUrl(`/v1/notebooks/${nbIds.notebookEmpty}/discover`), async () => {
          await gate
          return HttpResponse.json(discoverDeepResponse)
        }),
      )
      const { user } = renderPanel(notebookEmptyDetail)
      const input = await screen.findByRole("textbox", { name: "Find new sources on the internet" })
      await user.click(input)
      await user.paste("calvin cycle")
      await selectDropdownValue(user, screen.getByRole("combobox", { name: "Search type" }), "deep")

      await user.click(screen.getByRole("button", { name: "Search the web" }))

      expect(await screen.findByText("Searching… about 20 seconds")).toBeInTheDocument()
      expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Search the web" })).toBeDisabled()
      resolve()
      expect(await screen.findByText(WIKI)).toBeInTheDocument()
      expect(screen.queryByText("Searching… about 20 seconds")).not.toBeInTheDocument()
    })
  })

  describe("adding pages", () => {
    it("selects everything that can be added and posts url items in ONE request", async () => {
      const { user } = renderPanel(notebookEmptyDetail)
      await search(user)

      await user.click(screen.getByRole("button", { name: "Select all" }))

      expect(screen.getByRole("checkbox", { name: WIKI })).toBeChecked()
      expect(screen.getByRole("checkbox", { name: KHAN })).toBeChecked()
      expect(screen.getByRole("checkbox", { name: ADDED })).not.toBeChecked()
      expect(screen.getByRole("button", { name: "Add 2 sources" })).toBeEnabled()
    })

    it("adds the ticked pages as url sources with their titles, in one request, and shows them as being read", async () => {
      const posts = recordSourcePosts()
      const { user } = renderPanel()
      await screen.findByRole("checkbox", { name: "Biology 10.pdf" })
      await search(user)

      await user.click(screen.getByRole("checkbox", { name: WIKI }))
      await user.click(screen.getByRole("checkbox", { name: KHAN }))
      await user.click(screen.getByRole("button", { name: "Add 2 sources" }))

      // The results close and the new pages are in the list, being read.
      await until(resultsClosed)
      expect(await posts.bodies()).toEqual([
        {
          items: [
            { kind: "url", url: "https://uz.wikipedia.org/wiki/Fotosintez", title: WIKI },
            {
              kind: "url",
              url: "https://www.khanacademy.org/science/biology/photosynthesis/calvin-cycle",
              title: KHAN,
            },
          ],
        },
      ])
      expect(await screen.findByRole("checkbox", { name: "Biology 10.pdf" })).toBeInTheDocument()
      expect(await screen.findByRole("checkbox", { name: WIKI })).toBeInTheDocument()
      expect(screen.getAllByText(/Waiting…|Reading…/).length).toBeGreaterThan(0)
      posts.stop()
    })

    it("shows a page the site did not allow, with its message, and keeps the others added", async () => {
      server.use(
        http.post(sourcesUrl(), () =>
          HttpResponse.json(
            {
              items: [
                {
                  ...sourceFile,
                  id: nbIds.sourceStale,
                  kind: "url",
                  title: WIKI,
                  status: "pending",
                  position: 4,
                  ref: { url: "https://uz.wikipedia.org/wiki/Fotosintez" },
                },
              ],
              rejected: [
                {
                  index: 1,
                  error: {
                    type: "notebooks/source-unsupported",
                    title: "Unsupported",
                    status: 422,
                    message_key: "notebooks-source-unsupported",
                    params: { hint: "blocked" },
                  },
                },
              ],
            } satisfies AddSourcesResult,
            { status: 201 },
          ),
        ),
      )
      const { user } = renderPanel()
      await screen.findByRole("checkbox", { name: "Biology 10.pdf" })
      await search(user)
      await user.click(screen.getByRole("button", { name: "Select all" }))

      await user.click(screen.getByRole("button", { name: "Add 2 sources" }))

      const alert = await screen.findByRole("alert")
      expect(alert).toHaveTextContent("This site does not allow reading its pages. Open it and paste the text instead.")
      // The results stay open: the refused page is listed with its reason, the added one is marked as a source.
      const refused = screen.getByRole("checkbox", { name: KHAN }).closest("li")
      expect(refused).toContainElement(alert)
      expect(screen.getByRole("button", { name: "Back to sources" })).toBeInTheDocument()
      expect(isDisabled(screen.getByRole("checkbox", { name: WIKI }))).toBe(true)
    })

    it("uses the same text as the Add dialog for any other refusal", async () => {
      server.use(
        http.post(sourcesUrl(), () =>
          HttpResponse.json(
            {
              items: [],
              rejected: [
                {
                  index: 0,
                  error: {
                    type: "notebooks/source-duplicate",
                    title: "Already added",
                    status: 409,
                    message_key: "notebooks.source-duplicate",
                    params: {},
                  },
                },
              ],
            } satisfies AddSourcesResult,
            { status: 201 },
          ),
        ),
      )
      const { user } = renderPanel()
      await screen.findByRole("checkbox", { name: "Biology 10.pdf" })
      await search(user)

      await user.click(screen.getByRole("checkbox", { name: WIKI }))
      await user.click(screen.getByRole("button", { name: "Add 1 source" }))

      expect(await screen.findByRole("alert")).toHaveTextContent("This source is already in the notebook.")
    })

    it("shows the message of a request that failed as a whole and keeps the choice", async () => {
      server.use(http.post(sourcesUrl(), () => problem(500, "common/internal", "Boom")))
      const { user } = renderPanel()
      await screen.findByRole("checkbox", { name: "Biology 10.pdf" })
      await search(user)

      await user.click(screen.getByRole("checkbox", { name: WIKI }))
      await user.click(screen.getByRole("button", { name: "Add 1 source" }))

      expect(await screen.findByRole("alert")).toBeInTheDocument()
      expect(screen.getByRole("checkbox", { name: WIKI })).toBeChecked()
    })

    it("does not offer more pages than the notebook can take", async () => {
      for (let index = 0; index < 47; index += 1) {
        seedNotebookSource({
          ...sourceFile,
          id: `0000001f-0000-4000-8000-00000000${String(index + 100).padStart(4, "0")}`,
          title: `File ${index}.pdf`,
        })
      }
      const { user } = renderPanel()
      await screen.findByText("50 of 50 sources")
      await search(user)

      await user.click(screen.getByRole("button", { name: "Select all" }))

      expect(screen.getByRole("button", { name: "Add 0 sources" })).toBeDisabled()
      expect(
        screen.getByText("This notebook has reached the source limit. Remove a source to add more."),
      ).toBeInTheDocument()
    })
  })
})
