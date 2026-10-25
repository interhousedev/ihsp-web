import { describe, expect, it } from "bun:test"
import { apiUrl, libDetails, libUploads, server, setLibraryActor } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderLibrary } from "../test-support"
import { MyUploads } from "./my-uploads"

allowSlowRenders()

async function renderUploads() {
  const view = renderLibrary(<MyUploads />, { route: "/my/?tab=uploads" })
  const list = await screen.findByRole("list", { name: "Your uploads" })
  return { ...view, list }
}

const row = (list: HTMLElement, title: string) =>
  within(list).getByRole("link", { name: title }).closest("article") as HTMLElement

describe("MyUploads", () => {
  it("shows each upload with its status chip", async () => {
    const { list } = await renderUploads()

    expect(within(list).getAllByRole("listitem")).toHaveLength(7)
    const expected: [string, string][] = [
      [libDetails.matDraft.title, "Draft"],
      [libDetails.matPending.title, "Waiting for review"],
      [libDetails.matChanges.title, "Changes requested"],
      [libDetails.matPublished.title, "Published"],
      [libDetails.matHeld.title, "Held for review"],
      [libDetails.matRejected.title, "Rejected"],
      [libDetails.matUnpublished.title, "Removed"],
    ]
    for (const [title, status] of expected) {
      expect(within(row(list, title)).getByText(status)).toBeInTheDocument()
    }
  })

  it("shows the place in the review queue only for items waiting for review", async () => {
    const { list } = await renderUploads()

    expect(within(row(list, libDetails.matPending.title)).getByText("Place 1 in the review queue")).toBeInTheDocument()
    expect(screen.getAllByText(/in the review queue/)).toHaveLength(1)
  })

  it("shows the reviewer's message and reason for items that were sent back, refused or held", async () => {
    const { list } = await renderUploads()

    const changes = within(row(list, libDetails.matChanges.title))
    expect(changes.getByText("Please remove the phone number on page 2 and upload the file again.")).toBeInTheDocument()
    expect(changes.getByText("Personal data")).toBeInTheDocument()
    const rejected = within(row(list, libDetails.matRejected.title))
    expect(rejected.getByText("Answers to current homework are not allowed.")).toBeInTheDocument()
    expect(within(row(list, libDetails.matHeld.title)).getByText("Held after reports")).toBeInTheDocument()
    expect(within(row(list, libDetails.matUnpublished.title)).getByText("You withdrew it")).toBeInTheDocument()
  })

  it("offers Edit where the item can still be changed, Resubmit only after changes were requested", async () => {
    const { list } = await renderUploads()

    for (const detail of [libDetails.matDraft, libDetails.matPending, libDetails.matChanges, libDetails.matPublished]) {
      const edit = within(row(list, detail.title)).getByRole("link", { name: `Edit ${detail.title}` })
      expect(edit).toHaveAttribute("href", expect.stringMatching(new RegExp(`^/upload/edit/?\\?id=${detail.id}$`)))
    }
    for (const detail of [libDetails.matRejected, libDetails.matUnpublished]) {
      expect(within(row(list, detail.title)).queryByRole("link", { name: /^Edit/ })).not.toBeInTheDocument()
    }
    expect(screen.getAllByRole("button", { name: /^Resubmit/ })).toHaveLength(1)
    expect(
      within(row(list, libDetails.matChanges.title)).getByRole("button", { name: /^Resubmit/ }),
    ).toBeInTheDocument()
  })

  it("resubmits an item with changes requested, which then waits for review", async () => {
    const { user, list } = await renderUploads()

    await user.click(within(row(list, libDetails.matChanges.title)).getByRole("button", { name: /^Resubmit/ }))

    await waitFor(() =>
      expect(within(row(list, libDetails.matChanges.title)).getByText("Waiting for review")).toBeInTheDocument(),
    )
    expect(screen.queryByRole("button", { name: /^Resubmit/ })).not.toBeInTheDocument()
  })

  it("withdraws a published item after a confirmation", async () => {
    const { user, list } = await renderUploads()

    await user.click(
      within(row(list, libDetails.matPublished.title)).getByRole("button", {
        name: `Withdraw ${libDetails.matPublished.title}`,
      }),
    )
    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent("Withdraw this material?")
    await user.click(within(dialog).getByRole("button", { name: "Withdraw" }))

    await waitFor(() =>
      expect(within(row(list, libDetails.matPublished.title)).getByText("Removed")).toBeInTheDocument(),
    )
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("deletes a draft, with its own confirmation text", async () => {
    const { user, list } = await renderUploads()

    await user.click(
      within(row(list, libDetails.matDraft.title)).getByRole("button", {
        name: `Delete draft ${libDetails.matDraft.title}`,
      }),
    )
    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent("Delete this draft?")
    await user.click(within(dialog).getByRole("button", { name: "Delete draft" }))

    await waitFor(() => expect(screen.queryByText(libDetails.matDraft.title)).not.toBeInTheDocument())
  })

  it("keeps the item when the confirmation is cancelled", async () => {
    const { user, list } = await renderUploads()

    await user.click(
      within(row(list, libDetails.matPublished.title)).getByRole("button", {
        name: `Withdraw ${libDetails.matPublished.title}`,
      }),
    )
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(within(row(list, libDetails.matPublished.title)).getByText("Published")).toBeInTheDocument()
  })

  it("filters by status and goes back to all", async () => {
    const { user } = await renderUploads()
    const filter = screen.getByRole("group", { name: "Filter by status" })

    await user.click(within(filter).getByRole("button", { name: "Rejected" }))

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1))
    expect(within(filter).getByRole("button", { name: "Rejected" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText(libDetails.matRejected.title)).toBeInTheDocument()

    await user.click(within(filter).getByRole("button", { name: "All" }))
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(7))
  })

  it("loads the next page on request", async () => {
    server.use(
      http.get(apiUrl("/v1/me/library/uploads"), ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor")
        return cursor
          ? HttpResponse.json({ items: libUploads.slice(3), next_cursor: null })
          : HttpResponse.json({ items: libUploads.slice(0, 3), next_cursor: "page-2" })
      }),
    )
    const { user } = await renderUploads()
    expect(screen.getAllByRole("listitem")).toHaveLength(3)

    await user.click(screen.getByRole("button", { name: "Load more" }))

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(7))
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument()
  })

  it("has an empty state with one action when nothing was uploaded", async () => {
    setLibraryActor({ id: "00000000-0000-4000-8000-00000000abcd", roles: ["student"] })
    renderLibrary(<MyUploads />, { route: "/my/?tab=uploads" })

    expect(await screen.findByText("You have not uploaded anything yet.")).toBeInTheDocument()
    expect(within(screen.getByRole("status")).getByRole("link", { name: "Add a material" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/upload\/material\/?$/),
    )
  })

  it("shows an error with a retry button", async () => {
    server.use(http.get(apiUrl("/v1/me/library/uploads"), () => HttpResponse.json({}, { status: 500 })))
    renderLibrary(<MyUploads />, { route: "/my/?tab=uploads" })

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})
