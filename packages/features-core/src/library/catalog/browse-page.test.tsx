import { describe, expect, it } from "bun:test"
import { libDetails, setUniLibrary } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { allowSlowRenders, renderLibrary, renderLibraryAnonymous } from "../test-support"
import { BrowsePage } from "./browse-page"

allowSlowRenders()

describe("BrowsePage", () => {
  it("lists the catalogue with the source tags and the three source chips", async () => {
    renderLibrary(<BrowsePage />, { route: "/browse/" })

    const results = await screen.findByRole("list", { name: "Search results" })
    expect(within(results).getByText(libDetails.bookPhysics10.title)).toBeInTheDocument()
    expect(within(results).getAllByText("Library book").length).toBeGreaterThan(0)
    expect(within(results).getAllByText("Material").length).toBeGreaterThan(0)

    const chips = screen.getByRole("group", { name: "Source" })
    expect(
      within(chips)
        .getAllByRole("button")
        .map((chip) => chip.textContent),
    ).toEqual(["All", "Library books", "Materials"])
  })

  it("shows no UniLibrary chip, tag or block while UniLibrary is off, even for a text search", async () => {
    renderLibrary(<BrowsePage />, { route: "/browse/?q=physics" })

    await screen.findByRole("list", { name: "Search results" })
    expect(screen.queryByRole("button", { name: "UniLibrary" })).not.toBeInTheDocument()
    expect(screen.queryByText("More from UniLibrary")).not.toBeInTheDocument()
    expect(screen.queryByText("UniLibrary")).not.toBeInTheDocument()
  })

  it("ignores a shared ?source=external link while UniLibrary is off", async () => {
    renderLibrary(<BrowsePage />, { route: "/browse/?source=external" })

    expect(await screen.findByRole("list", { name: "Search results" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true")
  })

  it("adds the UniLibrary chip and the 'More from UniLibrary' block when it is on", async () => {
    setUniLibrary({ enabled: true })
    renderLibrary(<BrowsePage />, { route: "/browse/?q=mexanika" })

    expect(await screen.findByRole("button", { name: "UniLibrary" })).toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "More from UniLibrary" })).toBeInTheDocument()
    expect(screen.getByText("University-level material")).toBeInTheDocument()
    const links = await screen.findAllByRole("link", { name: /Open on UniLibrary/ })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", "noopener noreferrer")
    }
  })

  it("shows the saved-results banner when UniLibrary answered from its cache", async () => {
    setUniLibrary({ enabled: true, stale: true })
    renderLibrary(<BrowsePage />, { route: "/browse/?q=mexanika" })

    expect(await screen.findByText("UniLibrary is not responding. Showing saved results.")).toBeInTheDocument()
  })

  it("keeps the catalogue results when UniLibrary is down", async () => {
    setUniLibrary({ enabled: true, down: true })
    renderLibrary(<BrowsePage />, { route: "/browse/?q=physics" })

    expect(await screen.findByRole("list", { name: "Search results" })).toBeInTheDocument()
    expect(await screen.findByText("UniLibrary could not be reached.")).toBeInTheDocument()
  })

  it("lists only UniLibrary records on the UniLibrary tab", async () => {
    setUniLibrary({ enabled: true })
    renderLibrary(<BrowsePage />, { route: "/browse/?source=external&q=" })

    const list = await screen.findByRole("list", { name: "UniLibrary" })
    expect(within(list).getAllByRole("article").length).toBeGreaterThan(0)
    expect(screen.queryByText("Library book")).not.toBeInTheDocument()
  })

  it("filters by source and puts the filter in the address", async () => {
    const { user } = renderLibrary(<BrowsePage />, { route: "/browse/" })
    await screen.findByRole("list", { name: "Search results" })

    await user.click(screen.getByRole("button", { name: "Materials" }))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Materials" })).toHaveAttribute("aria-pressed", "true"),
    )
    await waitFor(() => expect(screen.queryAllByText("Library book")).toHaveLength(0))
  })

  it("shows an empty state with a hint when nothing matches", async () => {
    renderLibrary(<BrowsePage />, { route: "/browse/?q=zzzzzzzz" })

    expect(await screen.findByText(/Nothing found/)).toBeInTheDocument()
  })

  it("finds Latin Uzbek by a Cyrillic query", async () => {
    renderLibrary(<BrowsePage />, { route: `/browse/?q=${encodeURIComponent("ўткан")}` })

    const results = await screen.findByRole("list", { name: "Search results" })
    expect(within(results).getByText(libDetails.bookOtkanKunlar.title)).toBeInTheDocument()
  })

  it("shows the public books to a visitor", async () => {
    renderLibraryAnonymous(<BrowsePage />, { route: "/browse/" })

    const results = await screen.findByRole("list", { name: "Search results" })
    expect(within(results).getByText(libDetails.bookOtkanKunlar.title)).toBeInTheDocument()
    expect(within(results).queryByText(libDetails.bookPhysics10.title)).not.toBeInTheDocument()
  })
})
