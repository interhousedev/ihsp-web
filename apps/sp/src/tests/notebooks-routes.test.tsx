/** WEB-31, WEB-33: the notebook routes, the sidebar entry and the shell without the phone bottom bar. */
import { afterEach, describe, expect, test } from "bun:test"
import { apiUrl, nbIds, notebookDetail, problem, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import NotebooksRoute from "../app/notebooks/page"
import NotebookViewRoute from "../app/notebooks/view/page"
import { SpShell } from "../features/shell/components/sp-shell"
import { NOTEBOOKS_HREF, notebookHref } from "../features/notebooks/utils/hrefs"
import { configureTests, setViewportWidth } from "./helpers"
import { renderNotebooksSp } from "./notebooks-helpers"

configureTests()

afterEach(() => setViewportWidth(1280))

describe("notebook addresses", () => {
  test("the list is /notebooks/ and a notebook is /notebooks/view/?id=", () => {
    expect(NOTEBOOKS_HREF).toBe("/notebooks/")
    expect(notebookHref("abc")).toBe("/notebooks/view/?id=abc")
  })

  test("a new notebook opens with the Add sources dialog", () => {
    expect(notebookHref("abc", { add: true })).toBe("/notebooks/view/?id=abc&add=1")
  })

  test("the id is encoded", () => {
    expect(notebookHref("a b&c")).toBe("/notebooks/view/?id=a%20b%26c")
  })
})

describe("/notebooks/", () => {
  test("shows the list inside the app frame", async () => {
    renderNotebooksSp(<NotebooksRoute />, { route: "/notebooks/" })

    expect(await screen.findByRole("link", { name: /Photosynthesis/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open search" })).toBeInTheDocument()
  })

  test("the sidebar has Notebooks between the Assistant and Flash cards", async () => {
    renderNotebooksSp(<NotebooksRoute />, { route: "/notebooks/" })
    await screen.findByRole("link", { name: /Photosynthesis/ })

    const names = screen.getAllByRole("link").map((link) => link.textContent?.trim())
    expect(names.indexOf("Assistant")).toBeGreaterThan(-1)
    expect(names.indexOf("Notebooks")).toBeGreaterThan(names.indexOf("Assistant"))
    expect(names.indexOf("Flash cards")).toBeGreaterThan(names.indexOf("Notebooks"))
    expect(screen.getAllByRole("link", { name: "Notebooks" })[0]?.getAttribute("href")).toMatch(/^\/notebooks\/?$/)
  })
})

describe("/notebooks/view/", () => {
  test("opens the workspace of the notebook in ?id=", async () => {
    renderNotebooksSp(<NotebookViewRoute />, { route: `/notebooks/view/?id=${nbIds.notebook}` })

    expect(await screen.findByRole("button", { name: /Photosynthesis/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "All notebooks" })).toBeInTheDocument()
  })

  test("says the notebook was not found without an id", async () => {
    renderNotebooksSp(<NotebookViewRoute />, { route: "/notebooks/view/" })

    expect(await screen.findByText("This notebook was not found.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "All notebooks" })).toBeInTheDocument()
  })

  test("says the notebook was not found for an id that does not exist", async () => {
    renderNotebooksSp(<NotebookViewRoute />, { route: "/notebooks/view/?id=missing" })

    expect(await screen.findByText("This notebook was not found.")).toBeInTheDocument()
  })

  test("a subject reference creates (or gets) the subject notebook and opens it", async () => {
    testRouter.replace.mockClear()
    const posted: string[] = []
    server.use(
      http.post(apiUrl("/v1/notebooks/auto/subject/:subjectId"), ({ params }) => {
        posted.push(String(params.subjectId))
        return HttpResponse.json(notebookDetail)
      }),
    )
    renderNotebooksSp(<NotebookViewRoute />, { route: "/notebooks/view/?subject=subj-1" })

    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith(`/notebooks/view/?id=${notebookDetail.id}`))
    expect(posted).toEqual(["subj-1"])
  })

  test("a missing id with a subject reference falls back to the subject notebook", async () => {
    testRouter.replace.mockClear()
    renderNotebooksSp(<NotebookViewRoute />, { route: "/notebooks/view/?id=missing&subject=subj-1&lesson=l1" })

    await waitFor(() =>
      expect(testRouter.replace).toHaveBeenCalledWith(`/notebooks/view/?id=${notebookDetail.id}&lesson=l1`),
    )
  })

  test("says the subject is unknown when the subject notebook cannot be made", async () => {
    server.use(
      http.post(apiUrl("/v1/notebooks/auto/subject/:subjectId"), () =>
        problem(404, "notebooks/subject-not-found", "This subject is not known yet."),
      ),
    )
    renderNotebooksSp(<NotebookViewRoute />, { route: "/notebooks/view/?subject=nope" })

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This subject is not known yet. Try again after your timetable syncs.",
    )
  })

  test("shows an error with Try again when the notebook cannot be loaded", async () => {
    server.use(http.get(apiUrl("/v1/notebooks/:id"), () => problem(500, "server/error", "Boom")))
    renderNotebooksSp(<NotebookViewRoute />, { route: `/notebooks/view/?id=${nbIds.notebook}` })

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  test("has no phone bottom bar of the app: the workspace brings its own tab bar", async () => {
    setViewportWidth(360)
    renderNotebooksSp(<NotebookViewRoute />, { route: `/notebooks/view/?id=${nbIds.notebook}` })

    await screen.findByRole("button", { name: /Photosynthesis/ })

    expect(screen.queryByRole("navigation", { name: "Quick navigation" })).not.toBeInTheDocument()
    const tabs = await screen.findByRole("tablist", { name: "Notebook sections" })
    expect(
      within(tabs)
        .getAllByRole("tab")
        .map((tab) => tab.textContent),
    ).toEqual(["Sources", "Chat", "Studio"])
  })
})

describe("the app frame", () => {
  test("keeps the phone bottom bar by default", async () => {
    setViewportWidth(360)
    renderNotebooksSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )

    await screen.findByText("page body")

    expect(screen.getByRole("navigation", { name: "Quick navigation" })).toBeInTheDocument()
  })

  test("drops the phone bottom bar with hideBottomNav", async () => {
    setViewportWidth(360)
    renderNotebooksSp(
      <SpShell hideBottomNav>
        <p>page body</p>
      </SpShell>,
    )

    await screen.findByText("page body")

    expect(screen.queryByRole("navigation", { name: "Quick navigation" })).not.toBeInTheDocument()
  })
})
