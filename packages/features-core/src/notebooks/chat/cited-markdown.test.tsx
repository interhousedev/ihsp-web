import { afterEach, describe, expect, it } from "bun:test"
import { apiUrl, citation1, citation2, nbIds, server, webResults } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { CitedMarkdown } from "./cited-markdown"
import { CitationNavigationProvider } from "./use-citation-navigation"

allowSlowRenders()

const text = "Sugar from CO2 ⟦1⟧. It runs in the stroma ⟦1,2⟧.\n\n- a list item ⟦2⟧"

describe("CitedMarkdown", () => {
  it("renders a chip per cited number, with the source in its name", () => {
    renderNotebook(<CitedMarkdown text={text} citations={[citation1, citation2]} />)

    expect(screen.getAllByRole("button", { name: /Source 1: Biology 10\.pdf/ })).toHaveLength(2)
    expect(screen.getAllByRole("button", { name: /Source 2: Lesson 5/ })).toHaveLength(2)
    expect(screen.getByText(/a list item/)).toBeInTheDocument()
  })

  it("shows the quote when a chip is hovered", async () => {
    const { user } = renderNotebook(<CitedMarkdown text="Sugar ⟦1⟧." citations={[citation1]} />)

    await user.hover(screen.getByRole("button", { name: /Source 1/ }))

    expect(await screen.findByText(/RuBisCO fixes carbon dioxide/)).toBeInTheDocument()
  })

  it("opens the source at the passage on click", async () => {
    const { user, actions } = renderNotebook(<CitedMarkdown text="Sugar ⟦1⟧." citations={[citation1]} />)

    await user.click(screen.getByRole("button", { name: /Source 1/ }))

    await waitFor(() => expect(actions.openSource).toHaveBeenCalledWith(nbIds.sourceFile, citation1.passage_id))
  })

  it("disables a chip whose passage no longer exists", async () => {
    server.use(
      http.get(apiUrl(`/v1/notebooks/${nbIds.notebook}/passages/${citation1.passage_id}`), () =>
        HttpResponse.json({ type: "notebooks/not-found", title: "Not found", status: 404 }, { status: 404 }),
      ),
    )
    const { user, actions } = renderNotebook(<CitedMarkdown text="Sugar ⟦1⟧." citations={[citation1]} />)

    await user.click(screen.getByRole("button", { name: /Source 1/ }))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Source 1/ })).toHaveAttribute("aria-disabled", "true"),
    )
    expect(actions.openSource).not.toHaveBeenCalled()
  })

  it("drops a marker with no matching citation", () => {
    renderNotebook(<CitedMarkdown text="Sugar ⟦7⟧." citations={[citation1]} />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})

describe("CitedMarkdown: web markers", () => {
  const mixed = "Calvin cycle ⟦1⟧. Light into sugar ⟦w1⟧ and more ⟦w1,2⟧."

  it("renders a web chip beside the numbered chips and never the raw marker", () => {
    renderNotebook(<CitedMarkdown text={mixed} citations={[citation1]} web={webResults} />)

    expect(screen.getAllByRole("button", { name: /Source 1/ })).toHaveLength(1)
    expect(screen.getAllByRole("link", { name: /Web source 1: Photosynthesis/ })).toHaveLength(2)
    expect(screen.getByText("+1")).toBeInTheDocument()
    expect(document.body.textContent).not.toContain("⟦")
  })

  it("drops a web marker whose page is unknown or when no pages were passed", () => {
    renderNotebook(<CitedMarkdown text="Sugar ⟦w9⟧. More ⟦w1⟧." citations={[]} />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain("⟦")
  })
})

const renderProvided = () =>
  renderNotebook(
    <CitationNavigationProvider>
      <CitedMarkdown text="Sugar ⟦1⟧." citations={[citation1]} />
    </CitationNavigationProvider>,
  )

describe("CitationNavigationProvider", () => {
  const innerWidth = window.innerWidth
  afterEach(() => {
    window.innerWidth = innerWidth
  })

  it("opens the source viewer at the passage on a desktop", async () => {
    window.innerWidth = 1280
    const { user, actions } = renderProvided()

    await user.click(screen.getByRole("button", { name: /Source 1/ }))

    await waitFor(() => expect(actions.openSource).toHaveBeenCalledWith(nbIds.sourceFile, citation1.passage_id))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens a bottom sheet with the quote on a phone and the source from its button", async () => {
    window.innerWidth = 360
    const { user, actions } = renderProvided()

    await user.click(screen.getByRole("button", { name: /Source 1/ }))

    const sheet = await screen.findByRole("dialog")
    expect(within(sheet).getByText(/RuBisCO fixes carbon dioxide/)).toBeInTheDocument()
    expect(actions.openSource).not.toHaveBeenCalled()

    await user.click(within(sheet).getByRole("button", { name: "Open in source" }))

    expect(actions.openSource).toHaveBeenCalledWith(nbIds.sourceFile, citation1.passage_id)
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })
})
