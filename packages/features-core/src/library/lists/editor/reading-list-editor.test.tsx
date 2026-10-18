import { describe, expect, it } from "bun:test"
import { getReadingList, getReadingLists, type ReadingListDetail } from "@ihsp/api"
import {
  apiUrl,
  libCards,
  libExternalPinnedDetail,
  libIds,
  libListPhysics,
  libSubjects,
  pickCard,
  problem,
  selectDropdownValue,
  server,
  setLibraryActor,
  setUniLibrary,
  teacherMe,
  testRouter,
  userMe,
} from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import axe from "axe-core"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { ReadingListEditor } from "./reading-list-editor"

allowSlowRenders()

type As = "teacher" | "librarian" | "admin"

function renderEditor(route = "/lists/edit/", as: As = "teacher") {
  setLibraryActor(as)
  const user =
    as === "teacher"
      ? teacherMe
      : as === "admin"
        ? { ...userMe, roles: ["admin" as const] }
        : { ...userMe, roles: ["student" as const, "librarian" as const] }
  return renderLibrary(<ReadingListEditor />, { route, session: { user } })
}

const editOwn = (as: As = "teacher") => renderEditor(`/lists/edit/?id=${libIds.listPhysics}`, as)
const titles = libListPhysics.entries.map((entry) => entry.item?.title ?? entry.title ?? "")
const entriesList = () => screen.getByRole("list", { name: "Entries in order" })
const names = () =>
  within(entriesList())
    .getAllByRole("listitem")
    .map((li) => li.getAttribute("aria-label"))

async function fillNewList(user: ReturnType<typeof renderLibrary>["user"]) {
  await user.type(await screen.findByLabelText("Title"), "Optics reading")
  await selectDropdownValue(user, screen.getByLabelText("Subject"), libSubjects.physics.id)
}

function bigList(count: number): ReadingListDetail {
  return {
    ...libListPhysics,
    can_edit: true,
    entry_count: count,
    entries: Array.from({ length: count }, (_, index) => ({
      ...libListPhysics.entries[3]!,
      position: index + 1,
      url: `https://example.org/${index}`,
      title: `Link ${index + 1}`,
    })),
  }
}

describe("ReadingListEditor: a new list", () => {
  it("asks for a title and a subject, then creates the list and opens it", async () => {
    const { user } = renderEditor()
    expect(await screen.findByRole("heading", { level: 1, name: "New reading list" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Save list" }))

    expect(await screen.findByText("Write a title.")).toBeInTheDocument()
    expect(screen.getByText("Choose a subject.")).toBeInTheDocument()
    expect(screen.getByText("Some fields need your attention. They are marked above.")).toBeInTheDocument()

    await fillNewList(user)
    await selectDropdownValue(user, screen.getByLabelText("Year of study"), "1")
    await user.click(screen.getByRole("radio", { name: /Published/ }))
    await user.click(screen.getByRole("button", { name: "Save list" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledTimes(1))
    const mine = await getReadingLists({ mine: true })
    const created = mine.find((list) => list.title === "Optics reading")
    expect(created).toMatchObject({ status: "published", year_of_study: 1, subject: { name: "Physics" } })
    expect(testRouter.push).toHaveBeenCalledWith(expect.stringContaining(`id=${created!.id}`))
  })

  it("adds entries by searching the catalogue and sets their importance", async () => {
    const { user } = renderEditor()
    await fillNewList(user)

    await user.type(screen.getByRole("searchbox", { name: "Search books and materials" }), "mechanics")
    const results = await screen.findByRole("list", { name: "Search results" })
    const title = libCards.bookPhysics10.title
    await user.click(within(results).getByRole("button", { name: `Add ${title}` }))

    expect(within(entriesList()).getByText(title)).toBeInTheDocument()
    expect(screen.getByTestId("entry-count")).toHaveTextContent("1 of 100 entries")
    expect(within(results).getByText("Added")).toBeInTheDocument()
    const importance = screen.getByLabelText(`Importance of ${title}`)
    expect(importance).toHaveAttribute("data-value", "recommended")
    await selectDropdownValue(user, importance, "essential")
    await user.click(screen.getByRole("button", { name: "Save list" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledTimes(1))
    const created = (await getReadingLists({ mine: true })).find((list) => list.title === "Optics reading")!
    const detail = await getReadingList(created.id)
    expect(detail.entries).toHaveLength(1)
    expect(detail.entries[0]).toMatchObject({ importance: "essential" })
    expect(detail.entries[0]!.item?.id).toBe(libCards.bookPhysics10.id)
  })

  it("always allows a plain link, and checks its address", async () => {
    const { user } = renderEditor()
    await fillNewList(user)
    const form = await screen.findByRole("group", { name: "Add a link" })

    await user.type(within(form).getByLabelText("Title of the link"), "Video")
    await user.type(within(form).getByLabelText("Address"), "javascript:alert(1)")
    await user.click(within(form).getByRole("button", { name: "Add the link" }))
    expect(within(form).getByText(/Enter an address that starts with http/)).toBeInTheDocument()
    expect(screen.queryByRole("list", { name: "Entries in order" })).not.toBeInTheDocument()

    await user.clear(within(form).getByLabelText("Address"))
    await user.type(within(form).getByLabelText("Address"), "https://example.org/video")
    await user.click(within(form).getByRole("button", { name: "Add the link" }))

    const row = within(entriesList()).getAllByRole("listitem")[0]!
    expect(within(row).getByText("Video")).toBeInTheDocument()
    expect(within(row).getByText("Link")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Save list" }))
    await waitFor(() => expect(testRouter.push).toHaveBeenCalledTimes(1))
    const created = (await getReadingLists({ mine: true })).find((list) => list.title === "Optics reading")!
    expect((await getReadingList(created.id)).entries[0]).toMatchObject({
      url: "https://example.org/video",
      title: "Video",
    })
  })

  it("offers the teacher's groups for a list of groups and requires one", async () => {
    const { user } = renderEditor()
    await user.type(await screen.findByLabelText("Title"), "Group list")
    await user.click(screen.getByRole("radio", { name: /Groups/ }))

    expect(await screen.findByRole("checkbox", { name: "2TN2" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Save list" }))
    expect(await screen.findByText("Choose at least one group.")).toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: "2TN2" }))
    await user.click(screen.getByRole("button", { name: "Save list" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledTimes(1))
    const created = (await getReadingLists({ mine: true })).find((list) => list.title === "Group list")!
    expect(created.scope).toBe("groups")
    expect((await getReadingList(created.id)).group_ids).toHaveLength(1)
  })

  it("says that group lists are not available to a librarian who cannot list groups", async () => {
    const { user } = renderEditor("/lists/edit/", "librarian")
    await screen.findByLabelText("Title")

    expect(screen.getByRole("radio", { name: /Groups/ })).toBeDisabled()
    expect(screen.getByRole("radio", { name: /The whole lyceum/ })).toBeEnabled()
    await user.click(screen.getByRole("radio", { name: /The whole lyceum/ }))
    await user.type(screen.getByLabelText("Title"), "Whole school")
    await user.click(screen.getByRole("button", { name: "Save list" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledTimes(1))
    const created = (await getReadingLists({ mine: true })).find((list) => list.title === "Whole school")!
    expect(created.scope).toBe("school")
  })
})

describe("ReadingListEditor: an existing list", () => {
  it("loads the list with its entries, importance, pages, week, due date and note", async () => {
    editOwn()

    expect(await screen.findByRole("heading", { level: 1, name: "Edit reading list" })).toBeInTheDocument()
    expect(screen.getByLabelText("Title")).toHaveValue(libListPhysics.title)
    expect(screen.getByRole("radio", { name: /A subject/ })).toBeChecked()
    expect(screen.getByRole("radio", { name: /Published/ })).toBeChecked()
    expect(screen.getByTestId("entry-count")).toHaveTextContent("5 of 100 entries")
    const first = libListPhysics.entries[0]!.item!.title
    expect(screen.getByLabelText(`Importance of ${first}`)).toHaveAttribute("data-value", "essential")
    expect(screen.getByLabelText(`First page of ${first}`)).toHaveValue(5)
    expect(screen.getByLabelText(`Last page of ${first}`)).toHaveValue(30)
    expect(screen.getByLabelText(`Week or term label for ${first}`)).toHaveValue("Week 1")
    expect(screen.getByLabelText(`Due date for ${first}`)).toHaveValue("2026-10-14")
    expect(screen.getByLabelText(`Note for ${first}`)).toHaveValue("Read before the lab.")
  })

  it("changes the order with the move buttons and saves it", async () => {
    const { user } = editOwn()
    await screen.findByRole("heading", { level: 1, name: "Edit reading list" })
    const [first, second] = titles
    expect(names()[0]).toBe("Entry 1 of 5")

    await user.click(screen.getByRole("button", { name: `Move ${first} down` }))

    const rows = within(entriesList()).getAllByRole("listitem")
    expect(within(rows[0]!).getByText(second!)).toBeInTheDocument()
    expect(within(rows[1]!).getByText(first!)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: `Move ${second} up` })).toBeDisabled()
    expect(screen.getByText("Entry 1 moved to position 2 of 5.")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Save list" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledTimes(1))
    const saved = await getReadingList(libIds.listPhysics)
    expect(saved.entries.map((entry) => entry.item?.title ?? entry.title).slice(0, 2)).toEqual([second, first])
  })

  it("moves an entry from the keyboard with Alt and an arrow key on its handle", async () => {
    editOwn()
    await screen.findByRole("heading", { level: 1, name: "Edit reading list" })
    const [first, second] = titles

    const handle = screen.getByRole("button", { name: `Drag ${first} to change its place` })
    handle.focus()
    fireEvent.keyDown(handle, { key: "ArrowDown", altKey: true })

    const rows = within(entriesList()).getAllByRole("listitem")
    expect(within(rows[0]!).getByText(second!)).toBeInTheDocument()
  })

  it("removes an entry and edits the details of another", async () => {
    const { user } = editOwn()
    await screen.findByRole("heading", { level: 1, name: "Edit reading list" })
    const [first, second] = titles

    await user.click(screen.getByRole("button", { name: `Remove ${first}` }))
    await user.type(screen.getByLabelText(`Note for ${second}`), "Do the exercises")
    await user.click(screen.getByRole("button", { name: "Save list" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledTimes(1))
    const saved = await getReadingList(libIds.listPhysics)
    expect(saved.entries).toHaveLength(4)
    expect(saved.entries[0]).toMatchObject({ note: "Do the exercises" })
  })

  it("checks the pages of an entry before saving", async () => {
    const { user } = editOwn()
    await screen.findByRole("heading", { level: 1, name: "Edit reading list" })
    const first = libListPhysics.entries[0]!.item!.title

    await user.clear(screen.getByLabelText(`Last page of ${first}`))
    await user.type(screen.getByLabelText(`Last page of ${first}`), "2")
    await user.click(screen.getByRole("button", { name: "Save list" }))

    expect(await screen.findByText(/Pages must be whole numbers/)).toBeInTheDocument()
    expect(testRouter.push).not.toHaveBeenCalled()
  })

  it("deletes the list after a confirmation", async () => {
    const { user } = editOwn()
    await screen.findByRole("heading", { level: 1, name: "Edit reading list" })

    await user.click(screen.getByRole("button", { name: "Delete list" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent("Delete this list?")
    await user.click(within(dialog).getByRole("button", { name: "Delete list" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith(expect.stringMatching(/^\/lists\/?$/)))
    expect((await getReadingLists({ mine: true })).map((list) => list.id)).not.toContain(libIds.listPhysics)
  })

  it("says that a list the user may only read cannot be changed", async () => {
    server.use(
      http.get(apiUrl(`/v1/library/reading-lists/${libIds.listPhysics}`), () =>
        HttpResponse.json({ ...libListPhysics, can_edit: false }),
      ),
    )
    editOwn()

    expect(await screen.findByText("You can read this list but not change it")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open the list" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Save list" })).not.toBeInTheDocument()
  })

  it("says 'not available' for an unknown list", async () => {
    renderEditor("/lists/edit/?id=nope")

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
  })
})

describe("ReadingListEditor: the limit of 100 entries", () => {
  it("shows the count, stops adding at 100 and disables the add buttons", async () => {
    server.use(
      http.get(apiUrl(`/v1/library/reading-lists/${libIds.listPhysics}`), () => HttpResponse.json(bigList(100))),
    )
    const { user } = editOwn()

    expect(await screen.findByText("The list is full: 100 entries is the most.")).toBeInTheDocument()
    expect(screen.getByTestId("entry-count")).toHaveTextContent("100 of 100 entries")
    expect(screen.getByRole("button", { name: "Add the link" })).toBeDisabled()
    await user.type(screen.getByRole("searchbox", { name: "Search books and materials" }), "mechanics")
    const results = await screen.findByRole("list", { name: "Search results" })
    for (const button of within(results).getAllByRole("button")) expect(button).toBeDisabled()
  })

  it("explains the server's answer when a list turns out to be too long", async () => {
    server.use(
      http.put(apiUrl("/v1/library/reading-lists/:id/items"), () =>
        problem(422, "library/list-too-long", "Too long", { params: { limit: 100 } }),
      ),
    )
    const { user } = editOwn()
    await screen.findByRole("heading", { level: 1, name: "Edit reading list" })

    await user.click(screen.getByRole("button", { name: "Save list" }))

    expect(await screen.findByText("A reading list can have at most 100 entries.")).toBeInTheDocument()
    expect(testRouter.push).not.toHaveBeenCalled()
  })
})

describe("ReadingListEditor: UniLibrary", () => {
  it("offers no UniLibrary search while UniLibrary is off", async () => {
    editOwn()
    await screen.findByRole("heading", { level: 1, name: "Edit reading list" })

    expect(screen.queryByRole("group", { name: "Where to search" })).not.toBeInTheDocument()
    expect(screen.queryByText("UniLibrary")).not.toBeInTheDocument()
  })

  it("offers a UniLibrary search when it is on, and pins the record before adding it", async () => {
    setUniLibrary({ enabled: true })
    const { user } = editOwn()
    await screen.findByRole("heading", { level: 1, name: "Edit reading list" })

    const where = await screen.findByRole("group", { name: "Where to search" })
    await user.click(within(where).getByRole("button", { name: "UniLibrary" }))
    await user.type(screen.getByRole("searchbox", { name: "Search books and materials" }), "elektronika")
    const results = await screen.findByRole("list", { name: "Search results" })
    await user.click(within(results).getByRole("button", { name: /^Add Elektronika/ }))

    await waitFor(() => expect(screen.getByTestId("entry-count")).toHaveTextContent("6 of 100 entries"))
    expect(within(entriesList()).getByText("Elektronika va sxemalar 1")).toBeInTheDocument()
  })

  it("hides a UniLibrary entry while it is off, but saves it again so it is not lost", async () => {
    const external = {
      ...libListPhysics.entries[0]!,
      position: 6,
      item: pickCard(libExternalPinnedDetail),
      importance: "further" as const,
    }
    server.use(
      http.get(apiUrl(`/v1/library/reading-lists/${libIds.listPhysics}`), () =>
        HttpResponse.json({ ...libListPhysics, can_edit: true, entries: [...libListPhysics.entries, external] }),
      ),
    )
    let sent: { items: { item_id?: string }[] } | null = null
    server.use(
      http.put(apiUrl("/v1/library/reading-lists/:id/items"), async ({ request }) => {
        sent = (await request.clone().json()) as typeof sent
      }),
    )
    const { user } = editOwn()
    await screen.findByRole("heading", { level: 1, name: "Edit reading list" })
    expect(screen.queryByText(libExternalPinnedDetail.title)).not.toBeInTheDocument()
    expect(within(entriesList()).getAllByRole("listitem")).toHaveLength(5)

    await user.click(screen.getByRole("button", { name: "Save list" }))

    await waitFor(() => expect(sent).not.toBeNull())
    expect(sent!.items).toHaveLength(6)
    expect(sent!.items.map((item) => item.item_id)).toContain(libExternalPinnedDetail.id!)
  })
})

describe("ReadingListEditor: accessibility", () => {
  it("has no axe violations with a list loaded", async () => {
    const { container } = editOwn()
    await screen.findByRole("heading", { level: 1, name: "Edit reading list" })

    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } })

    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })
})
