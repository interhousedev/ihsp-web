import { describe, expect, it } from "bun:test"
import { libCollectionClassics, libIds } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { allowSlowRenders, renderLibrary } from "../test-support"
import { CollectionPage } from "./collection-page"

allowSlowRenders()

describe("CollectionPage", () => {
  it("shows the collection and its items", async () => {
    renderLibrary(<CollectionPage />, { route: `/collections/view/?id=${libIds.collectionClassics}` })

    expect(await screen.findByRole("heading", { level: 1, name: libCollectionClassics.title })).toBeInTheDocument()
    expect(await screen.findByRole("list", { name: libCollectionClassics.title })).toBeInTheDocument()
  })

  it("says 'not available' for an unknown collection or a missing id", async () => {
    const { unmount } = renderLibrary(<CollectionPage />, { route: "/collections/view/?id=nope" })
    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
    unmount()

    renderLibrary(<CollectionPage />, { route: "/collections/view/" })
    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
  })
})
