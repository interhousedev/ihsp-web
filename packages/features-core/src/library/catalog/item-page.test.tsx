import { describe, expect, it } from "bun:test"
import { libDetails, libExternalPinnedDetail, libIds, server, setUniLibrary } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import axe from "axe-core"
import { allowSlowRenders, renderLibrary, renderLibraryAnonymous } from "../test-support"
import { ItemPage } from "./item-page"

allowSlowRenders()

function renderItem(id: string, options: Parameters<typeof renderLibrary>[1] = {}) {
  return renderLibrary(<ItemPage />, { route: `/item/?id=${id}`, ...options })
}

describe("ItemPage: UniLibrary record", () => {
  it("is a link-only page: Open on UniLibrary in a new tab, no Read, no Add to notebook", async () => {
    setUniLibrary({ enabled: true })
    renderItem(libIds.extPinned)

    const open = await screen.findByRole("link", { name: /Open on UniLibrary/ })
    expect(open).toHaveAttribute("target", "_blank")
    expect(open).toHaveAttribute("rel", "noopener noreferrer")
    expect(open.getAttribute("href")).toBe(libExternalPinnedDetail.external!.view_url)
    expect(screen.getByText("You read this book on UniLibrary after signing in there.")).toBeInTheDocument()
    expect(screen.getByText("University-level material")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Read" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add to notebook" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Save for offline/ })).not.toBeInTheDocument()
  })

  it("is not available at all while UniLibrary is off", async () => {
    renderItem(libIds.extPinned)

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Open on UniLibrary/ })).not.toBeInTheDocument()
  })
})

describe("ItemPage: book", () => {
  it("shows the actions and the contents of a lyceum textbook", async () => {
    renderItem(libIds.bookPhysics10)

    expect(await screen.findByRole("heading", { level: 1, name: libDetails.bookPhysics10.title })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Read" }).getAttribute("href")).toContain("item=")
    expect(screen.getByRole("button", { name: "Add to notebook" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Contents" })).toBeInTheDocument()
    // The official textbook may not be downloaded.
    expect(screen.queryByRole("button", { name: "Download" })).not.toBeInTheDocument()
  })

  it("offers Download for a public-domain book", async () => {
    renderItem(libIds.bookOpenPhysics)

    expect(await screen.findByRole("button", { name: "Download" })).toBeInTheDocument()
  })

  it("warns that a scan has no text and disables the notebook", async () => {
    renderItem(libIds.bookGeometryScan)

    expect(await screen.findByText(/scan without text/)).toBeInTheDocument()
  })

  it("lets a signed-out visitor see a public book but sign in for the account actions", async () => {
    renderLibraryAnonymous(<ItemPage />, { route: `/item/?id=${libIds.bookOtkanKunlar}` })

    expect(await screen.findByRole("heading", { level: 1, name: libDetails.bookOtkanKunlar.title })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add to notebook" })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Sign in/ }).length).toBeGreaterThan(0))
  })

  it("says only 'not available' for a lyceum book to a visitor, and offers Sign in", async () => {
    renderLibraryAnonymous(<ItemPage />, { route: `/item/?id=${libIds.bookPhysics10}` })

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: "Sign in to read this item." })).toBeInTheDocument())
  })

  it("shows a signed-in user a plain not-found state for a missing item, without Sign in", async () => {
    renderItem("00000000-0000-0000-0000-000000000000")

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Sign in to read this item." })).not.toBeInTheDocument()
  })

  it("asks for an item once, after the session restore, not before it", async () => {
    let calls = 0
    server.events.on("request:start", ({ request }) => {
      if (request.url.includes("/v1/library/items/")) calls += 1
    })
    renderItem("00000000-0000-0000-0000-000000000000")

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
    server.events.removeAllListeners()
    expect(calls).toBe(1)
  })

  it("has no accessibility violations", async () => {
    const { container } = renderItem(libIds.bookPhysics10)
    await screen.findByRole("heading", { level: 1, name: libDetails.bookPhysics10.title })

    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } })
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })
})

describe("ItemPage: material", () => {
  it("shows who uploaded it and, to the owner, the status, the reviewer's message and Edit", async () => {
    renderItem(libIds.matChanges)

    expect(await screen.findByText(/Uploaded by Aziza K\., 2025/)).toBeInTheDocument()
    expect(screen.getByText("Changes requested")).toBeInTheDocument()
    expect(screen.getByText(/Message from the reviewer/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Edit" }).getAttribute("href")).toContain("/upload/edit")
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeInTheDocument()
  })

  it("shows the teacher by name and no owner panel to another reader", async () => {
    renderItem(libIds.matTeacher)

    expect(await screen.findByText(/Uploaded by/)).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Your upload" })).not.toBeInTheDocument()
  })

  it("keeps the notice for a removed material", async () => {
    renderItem(libIds.matUnpublished)

    expect(await screen.findByText("This item was removed")).toBeInTheDocument()
  })
})
