import { describe, expect, it } from "bun:test"
import { setLibraryActor, userMe } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { CollectionsPage } from "./collections-page"

allowSlowRenders()

function renderCollections() {
  setLibraryActor("librarian")
  return renderLibrary(<CollectionsPage />, {
    route: "/manage/collections/",
    session: { user: { ...userMe, roles: ["student", "librarian"] } },
  })
}

describe("CollectionsPage", () => {
  it("lists the collections with their item counts and published state", async () => {
    renderCollections()

    const list = await screen.findByRole("list", { name: "Collections" })
    const classics = within(list).getByText("Uzbek classics").closest("li") as HTMLElement
    expect(within(classics).getByText("2 items")).toBeInTheDocument()
    expect(within(classics).getByText("Published")).toBeInTheDocument()
    const summer = within(list).getByText("Summer reading").closest("li") as HTMLElement
    expect(within(summer).getByText("Not published")).toBeInTheDocument()
  })

  it("creates a collection with titles in three languages and an item found by search", async () => {
    const { user } = renderCollections()
    await screen.findByRole("list", { name: "Collections" })

    await user.click(screen.getAllByRole("button", { name: "New collection" })[0]!)
    const dialog = await screen.findByRole("dialog", { name: "New collection" })
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect((await within(dialog).findAllByText("This field is required.")).length).toBe(3)

    await user.type(within(dialog).getByLabelText("Title (Uzbek)"), "Fizika")
    await user.type(within(dialog).getByLabelText("Title (Russian)"), "Физика")
    await user.type(within(dialog).getByLabelText("Title (English)"), "Physics reading")
    await user.click(within(dialog).getByRole("switch", { name: "Published" }))
    await user.type(within(dialog).getByLabelText("Find items to add"), "physics")
    const add = await within(dialog).findByRole("button", { name: /^Add Physics 10: Mechanics/ })
    await user.click(add)
    expect(within(dialog).getByRole("list", { name: "Items of the collection, in order" })).toHaveTextContent(
      "Physics 10: Mechanics",
    )
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    const created = (await screen.findByText("Physics reading")).closest("li") as HTMLElement
    expect(within(created).getByText("1 item")).toBeInTheDocument()
    expect(within(created).getByText("Published")).toBeInTheDocument()
  })

  it("loads the items of an existing collection, lets the librarian reorder and remove them", async () => {
    const { user } = renderCollections()
    await screen.findByRole("list", { name: "Collections" })

    await user.click(screen.getByRole("button", { name: "Edit Uzbek classics" }))
    const dialog = await screen.findByRole("dialog", { name: "Edit collection" })
    const items = await within(dialog).findByRole("list", { name: "Items of the collection, in order" })
    const names = () =>
      within(items)
        .getAllByRole("listitem")
        .map((li) => li.textContent ?? "")
    expect(names()[0]).toContain("Ўткан кунлар")

    await user.click(within(dialog).getByRole("button", { name: "Move Ўткан кунлар down" }))
    expect(names()[1]).toContain("Ўткан кунлар")

    await user.click(within(dialog).getByRole("button", { name: "Remove Gʻazallar from the collection" }))
    expect(within(items).getAllByRole("listitem")).toHaveLength(1)
  })

  it("deletes a collection after a confirmation", async () => {
    const { user } = renderCollections()
    await screen.findByRole("list", { name: "Collections" })

    await user.click(screen.getByRole("button", { name: "Delete Summer reading" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(screen.queryByText("Summer reading")).not.toBeInTheDocument())
  })
})
