import { describe, expect, it } from "bun:test"
import { webResults } from "@ihsp/test-utils"
import { act, screen, within } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { WebCitationChip } from "./web-citation-chip"

allowSlowRenders()

const [first, second] = webResults

describe("WebCitationChip", () => {
  it("shows the globe and the site of the page, named by its number and title", () => {
    renderNotebook(<WebCitationChip numbers={[1]} web={webResults} />)

    const chip = screen.getByRole("link", { name: "Web source 1: Photosynthesis - Wikipedia" })
    expect(within(chip).getByText("uz.wikipedia.org")).toBeInTheDocument()
    expect(chip.querySelector("svg")).not.toBeNull()
    expect(chip).toHaveAttribute("href", first?.url)
    expect(chip).toHaveAttribute("target", "_blank")
    expect(chip).toHaveAttribute("rel", "noopener noreferrer nofollow")
  })

  it("adds +1 for a second page and names both pages for screen readers", () => {
    renderNotebook(<WebCitationChip numbers={[1, 2]} web={webResults} />)

    const chip = screen.getByRole("link", { name: /Web source 1: Photosynthesis - Wikipedia/ })
    expect(chip).toHaveAccessibleName(/uz\.wikipedia\.org and 1 more/)
    expect(within(chip).getByText("+1")).toBeInTheDocument()
  })

  it("opens a card with title, site, snippet, address and an Open page link when focused", async () => {
    renderNotebook(<WebCitationChip numbers={[2]} web={webResults} />)

    expect(screen.queryByText(/Calvin cycle uses ATP/)).not.toBeInTheDocument()
    act(() => screen.getByRole("link", { name: /Web source 2/ }).focus())

    expect(await screen.findByText(second?.snippet ?? "")).toBeInTheDocument()
    expect(screen.getByText(second?.url ?? "")).toBeInTheDocument()
    expect(screen.getAllByText("khanacademy.org").length).toBeGreaterThan(0)
    const open = screen.getByRole("link", { name: /Open page/ })
    expect(open).toHaveAttribute("href", second?.url)
    expect(open).toHaveAttribute("target", "_blank")
    expect(open).toHaveAttribute("rel", "noopener noreferrer nofollow")
  })

  it("opens the card on hover and lists every page of a grouped marker", async () => {
    const { user } = renderNotebook(<WebCitationChip numbers={[1, 2]} web={webResults} />)

    await user.hover(screen.getByRole("link", { name: /Web source 1/ }))

    expect(await screen.findByText(first?.snippet ?? "")).toBeInTheDocument()
    expect(screen.getByText(second?.snippet ?? "")).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: /Open page/ })).toHaveLength(2)
  })

  it("renders nothing for a number without a result", () => {
    const { container } = renderNotebook(<WebCitationChip numbers={[7]} web={webResults} />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it("skips the unknown numbers of a group and renders nothing without any results", () => {
    const { rerender } = renderNotebook(<WebCitationChip numbers={[7, 2]} web={webResults} />)

    const chip = screen.getByRole("link", { name: /Web source 2/ })
    expect(within(chip).queryByText(/^\+\d/)).not.toBeInTheDocument()

    rerender(<WebCitationChip numbers={[1]} web={[]} />)
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
