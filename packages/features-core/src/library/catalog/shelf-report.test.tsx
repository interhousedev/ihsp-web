import { describe, expect, it } from "bun:test"
import { libCards, libIds, libExternalCards, setUniLibrary } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { allowSlowRenders, renderLibrary, renderLibraryAnonymous } from "../test-support"
import { ExternalActions } from "./external-actions"
import { ReportDialog } from "./report-dialog"
import { ShelfButton } from "./shelf-button"

allowSlowRenders()

describe("ShelfButton", () => {
  it("adds a book to the shelf and shows the new state", async () => {
    const card = { ...libCards.bookOpenPhysics, shelf_state: null }
    const { user } = renderLibrary(<ShelfButton item={card} />)

    await user.click(await screen.findByRole("button", { name: "Add to shelf" }))
    await user.click(await screen.findByRole("menuitem", { name: "Reading" }))

    expect(await screen.findByRole("button", { name: "Shelf: Reading" })).toBeInTheDocument()
  })

  it("removes an item from the shelf", async () => {
    const card = { ...libCards.bookOpenPhysics, shelf_state: "want" as const }
    const { user } = renderLibrary(<ShelfButton item={card} />)

    await user.click(await screen.findByRole("button", { name: "Shelf: Want to read" }))
    await user.click(await screen.findByRole("menuitem", { name: "Remove from shelf" }))

    expect(await screen.findByRole("button", { name: "Add to shelf" })).toBeInTheDocument()
  })

  it("asks a visitor to sign in instead of showing a dead button", async () => {
    renderLibraryAnonymous(<ShelfButton item={libCards.bookOtkanKunlar} />)

    expect(await screen.findByRole("button", { name: "Sign in to use shelves" })).toBeInTheDocument()
  })

  it("pins an unstored UniLibrary record before putting it on the shelf", async () => {
    setUniLibrary({ enabled: true })
    const record = libExternalCards.find((card) => card.id === null)!
    const { user } = renderLibrary(<ShelfButton item={record} />)

    await user.click(await screen.findByRole("button", { name: "Add to shelf" }))
    await user.click(await screen.findByRole("menuitem", { name: "Want to read" }))

    expect(await screen.findByRole("button", { name: "Shelf: Want to read" })).toBeInTheDocument()
  })
})

describe("ReportDialog", () => {
  it("needs a reason before it can be sent, then thanks the reporter", async () => {
    const closed: boolean[] = []
    const { user } = renderLibrary(
      <ReportDialog itemId={libIds.matTeacher} open onOpenChange={(open) => closed.push(open)} />,
    )

    const send = await screen.findByRole("button", { name: "Send report" })
    expect(send).toBeDisabled()
    await user.click(screen.getByRole("radio", { name: "Copyright" }))
    expect(send).toBeEnabled()
    await user.click(send)

    await waitFor(() => expect(closed).toContain(false))
  })

  it("asks a visitor to sign in", async () => {
    renderLibraryAnonymous(<ReportDialog itemId={libIds.matTeacher} open onOpenChange={() => undefined} />)

    expect(await screen.findByText("Sign in to report an item.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Send report" })).not.toBeInTheDocument()
  })
})

describe("ExternalActions", () => {
  it("offers Open on UniLibrary as the only way to read a UniLibrary record", async () => {
    setUniLibrary({ enabled: true })
    const record = libExternalCards[0]!
    renderLibrary(<ExternalActions item={record} />)

    const open = await screen.findByRole("link", { name: /Open on UniLibrary/ })
    expect(open).toHaveAttribute("href", record.external!.view_url)
    expect(open).toHaveAttribute("target", "_blank")
    expect(open).toHaveAttribute("rel", "noopener noreferrer")
    expect(screen.queryByRole("link", { name: "Read" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add to notebook" })).not.toBeInTheDocument()
  })

  it("has no Open link for a record that is gone", async () => {
    setUniLibrary({ enabled: true })
    const gone = libExternalCards.find((card) => card.external?.gone)!
    renderLibrary(<ExternalActions item={gone} />)

    await screen.findByRole("button", { name: "Add to shelf" })
    expect(screen.queryByRole("link", { name: /Open on UniLibrary/ })).not.toBeInTheDocument()
  })
})
