import { describe, expect, it } from "bun:test"
import { libCardWithSnippet, libCards, libExternalCards } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { renderLibrary } from "../test-support"
import { ItemCardView } from "./item-card"
import { ItemGrid } from "./item-grid"

describe("ItemCardView", () => {
  it("links the title to the item page and tags a book with its rights", () => {
    renderLibrary(<ItemCardView item={libCards.bookOpenPhysics} />)

    expect(screen.getByRole("link", { name: libCards.bookOpenPhysics.title }).getAttribute("href")).toContain("/item")
    expect(screen.getByText("Library book")).toBeInTheDocument()
    expect(screen.getByText("Open licence (CC BY-SA 4.0)")).toBeInTheDocument()
  })

  it("shows 'Uploaded by Aziza K., 2025' for a student and the teacher's name alone for a teacher", () => {
    const { unmount } = renderLibrary(<ItemCardView item={libCards.matPublished} />)
    expect(screen.getByText(/Uploaded by Aziza K\., 2025/)).toBeInTheDocument()
    unmount()

    renderLibrary(<ItemCardView item={libCards.matTeacher} />)
    expect(screen.queryByText(/, 20\d\d/)).not.toBeInTheDocument()
    expect(screen.getByText(/^Uploaded by /)).toBeInTheDocument()
  })

  it("shows the snippet of a full-text hit with its page", () => {
    renderLibrary(<ItemCardView item={libCardWithSnippet} />)

    expect(screen.getByText(new RegExp(`page ${libCardWithSnippet.snippet_page}`))).toBeInTheDocument()
  })

  it("carries Open on UniLibrary on a UniLibrary card, in a new tab, and the access chip", () => {
    const record = libExternalCards.find((card) => card.external?.access === "partial")!
    renderLibrary(<ItemCardView item={record} />)

    const open = screen.getByRole("link", { name: /Open on UniLibrary/ })
    expect(open).toHaveAttribute("href", record.external!.view_url)
    expect(open).toHaveAttribute("target", "_blank")
    expect(open).toHaveAttribute("rel", "noopener noreferrer")
    expect(screen.getByText("Partly open")).toBeInTheDocument()
    expect(screen.getByText("UniLibrary")).toBeInTheDocument()
  })

  it("does not link an unstored UniLibrary record to an item page", () => {
    const record = libExternalCards.find((card) => card.id === null)!
    renderLibrary(<ItemCardView item={record} />)

    expect(screen.queryByRole("link", { name: record.title })).not.toBeInTheDocument()
    expect(screen.getByText(record.title)).toBeInTheDocument()
  })

  it("renders a grid of cards as a labelled list", () => {
    renderLibrary(<ItemGrid items={[libCards.bookOpenPhysics, libCards.matTeacher]} label="Results" />)

    const list = screen.getByRole("list", { name: "Results" })
    expect(within(list).getAllByRole("listitem")).toHaveLength(2)
  })
})
