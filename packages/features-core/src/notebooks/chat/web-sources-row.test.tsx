import { describe, expect, it } from "bun:test"
import { webResults } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { WebSourcesRow } from "./web-sources-row"

allowSlowRenders()

const third = { ...webResults[1]!, n: 3, title: "Third page", url: "https://example.org/third", cited: false }
const pages = [{ ...webResults[0]!, cited: false }, { ...webResults[1]!, cited: true }, third]

describe("WebSourcesRow", () => {
  it("renders nothing without web results", () => {
    const { container } = renderNotebook(<WebSourcesRow web={[]} text="Plain answer" />)

    expect(container).toBeEmptyDOMElement()
  })

  it("is a collapsed button with the number of pages", () => {
    renderNotebook(<WebSourcesRow web={webResults} text="Sugar ⟦w1⟧." />)

    const button = screen.getByRole("button", { name: /Sources · 2/ })
    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("list", { name: "Web pages used for this answer" })).not.toBeInTheDocument()
  })

  it("expands a list of pages with number, title link, site and snippet", async () => {
    const { user } = renderNotebook(<WebSourcesRow web={webResults} text="Sugar ⟦w1⟧." />)

    await user.click(screen.getByRole("button", { name: /Sources · 2/ }))

    expect(screen.getByRole("button", { name: /Sources · 2/ })).toHaveAttribute("aria-expanded", "true")
    const list = screen.getByRole("list", { name: "Web pages used for this answer" })
    const rows = within(list).getAllByRole("listitem")
    expect(rows).toHaveLength(2)
    const link = within(rows[0]!).getByRole("link", { name: "Photosynthesis - Wikipedia" })
    expect(link).toHaveAttribute("href", "https://uz.wikipedia.org/wiki/Fotosintez")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow")
    expect(within(rows[0]!).getByText("uz.wikipedia.org")).toBeInTheDocument()
    expect(within(rows[0]!).getByText(/process by which plants turn light/)).toBeInTheDocument()
    expect(within(rows[0]!).getByText("1")).toBeInTheDocument()
  })

  it("collapses again on a second click", async () => {
    const { user } = renderNotebook(<WebSourcesRow web={webResults} text="Sugar ⟦w1⟧." />)
    const button = screen.getByRole("button", { name: /Sources/ })

    await user.click(button)
    await user.click(button)

    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  it("lists the pages the answer cites first, in the order of the text, then the rest", async () => {
    const { user } = renderNotebook(<WebSourcesRow web={pages} text="A ⟦w3⟧ and B ⟦w1⟧." />)

    await user.click(screen.getByRole("button", { name: /Sources · 3/ }))

    const titles = within(screen.getByRole("list")).getAllByRole("link")
    // The text cites 3 then 1; page 2 is flagged cited by the server but not used in the text; none is dropped.
    expect(titles.map((link) => link.textContent)).toEqual([
      "Third page",
      "Photosynthesis - Wikipedia",
      "The Calvin cycle (Khan Academy)",
    ])
  })

  it("falls back to the cited flag when the text has no web markers", async () => {
    const { user } = renderNotebook(<WebSourcesRow web={pages} text="No markers" />)

    await user.click(screen.getByRole("button", { name: /Sources · 3/ }))

    const titles = within(screen.getByRole("list")).getAllByRole("link")
    expect(titles[0]?.textContent).toBe("The Calvin cycle (Khan Academy)")
    expect(titles).toHaveLength(3)
  })
})
