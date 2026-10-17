import { afterEach, describe, expect, it, spyOn } from "bun:test"
import { putShelfEntry } from "@ihsp/api"
import { libDetails, libIds, libListPhysics, setLibraryActor, setUniLibrary } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import axe from "axe-core"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { MyLibraryPage } from "./my-library-page"

allowSlowRenders()
afterEach(() => setLibraryActor("student"))

const renderMy = (tab?: string, extra = "") =>
  renderLibrary(<MyLibraryPage />, { route: `/my/${tab ? `?tab=${tab}${extra}` : ""}` })

describe("MyLibraryPage: tabs", () => {
  it("opens on Continue and lists the tabs of the design without an Offline tab", async () => {
    renderMy()

    expect(await screen.findByRole("heading", { level: 1, name: "My library" })).toBeInTheDocument()
    const tabs = screen.getAllByRole("tab").map((tab) => tab.textContent)
    expect(tabs).toEqual(["Continue", "Shelf", "Notes", "Lists", "My uploads", "My suggestions"])
    expect(screen.getByRole("tab", { name: "Continue" })).toHaveAttribute("aria-selected", "true")
  })

  it("opens the tab named in the address", async () => {
    renderMy("notes")

    expect(await screen.findByRole("tab", { name: "Notes" })).toHaveAttribute("aria-selected", "true")
  })

  it("switches to the chosen tab and shows its content", async () => {
    const { user } = renderMy()
    await screen.findByRole("tab", { name: "Shelf" })

    await user.click(screen.getByRole("tab", { name: "Shelf" }))

    expect(screen.getByRole("tab", { name: "Shelf" })).toHaveAttribute("aria-selected", "true")
    expect(await screen.findByText(libDetails.bookOpenPhysics.title)).toBeInTheDocument()
  })
})

describe("MyLibraryPage: Continue", () => {
  it("shows the books being read with their progress and a link that continues reading", async () => {
    renderMy("continue")

    const list = await screen.findByRole("list", { name: "Continue" })
    const cards = within(list).getAllByRole("listitem")
    expect(cards).toHaveLength(2)
    expect(within(list).getByText(libDetails.bookPhysics10.title)).toBeInTheDocument()
    const links = within(list).getAllByRole("link", { name: "Continue reading" })
    expect(links[0]!.getAttribute("href")).toContain("item=")
  })

  it("invites to the catalogue when nothing was started", async () => {
    setLibraryActor({ id: "00000000-0000-4000-8000-0000000000aa", roles: ["student"], name: "New S." })
    renderMy("continue")

    expect(await screen.findByText(/No book started yet/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Browse the catalogue" })).toBeInTheDocument()
  })
})

describe("MyLibraryPage: Shelf", () => {
  it("shows every state with counts and keeps a taken-down item as a row that says so", async () => {
    renderMy("shelf")

    expect(await screen.findByText(libDetails.bookOpenPhysics.title)).toBeInTheDocument()
    expect(screen.getByText("No longer available")).toBeInTheDocument()
    expect(screen.getByText(libDetails.bookTakenDown.title)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove from shelf" })).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: /^Reading\s*2$/ })).toBeInTheDocument()
  })

  it("filters by state", async () => {
    const { user } = renderMy("shelf")
    await screen.findByText(libDetails.bookOpenPhysics.title)

    await user.click(await screen.findByRole("button", { name: /^Finished/ }))

    await waitFor(() => expect(screen.queryByText(libDetails.bookOpenPhysics.title)).not.toBeInTheDocument())
    expect(screen.getByText(libDetails.matTeacher.title)).toBeInTheDocument()
    expect(screen.queryByText("No longer available")).not.toBeInTheDocument()
  })

  it("takes a removed item off the shelf", async () => {
    const { user } = renderMy("shelf")

    await user.click(await screen.findByRole("button", { name: "Remove from shelf" }))

    await waitFor(() => expect(screen.queryByText("No longer available")).not.toBeInTheDocument())
  })

  it("shows a pinned UniLibrary record as a link-only card when UniLibrary is on", async () => {
    setUniLibrary({ enabled: true })
    await putShelfEntry(libIds.extPinned, { state: "want" })
    renderMy("shelf")

    expect(await screen.findByRole("link", { name: /Open on UniLibrary/ })).toBeInTheDocument()
  })

  it("shows nothing from UniLibrary while it is off", async () => {
    setUniLibrary({ enabled: true })
    await putShelfEntry(libIds.extPinned, { state: "want" })
    setUniLibrary({ enabled: false })
    renderMy("shelf")

    await screen.findByText(libDetails.bookOpenPhysics.title)
    expect(screen.queryByText(/UniLibrary/)).not.toBeInTheDocument()
  })
})

describe("MyLibraryPage: Notes", () => {
  it("groups the notes by item, newest first, with the quote, the note and a link into the reader", async () => {
    renderMy("notes")

    const physics = await screen.findByRole("region", { name: libDetails.bookPhysics10.title })
    const notes = within(physics)
      .getAllByRole("listitem")
      .map((item) => item.textContent ?? "")
    // Newest change first: the bookmark of page 44, then the highlight of page 8.
    expect(notes[0]).toContain("Bookmark")
    expect(notes[1]).toContain("The velocity of a body is the rate of change of its position.")
    expect(notes).toHaveLength(4)
    expect(within(physics).getByText("Compare with the derivative from the maths lesson.")).toBeInTheDocument()
    const page8 = within(physics).getAllByRole("link", { name: "Open in the reader" })[1]!
    expect(page8.getAttribute("href")).toContain(`item=${libIds.bookPhysics10}`)
    expect(page8.getAttribute("href")).toContain("page=8")
    expect(page8.getAttribute("href")).toContain(`file=${libIds.filePhysics10}`)

    const epub = screen.getByRole("region", { name: libDetails.bookOtkanKunlar.title })
    const cfiLink = within(epub).getAllByRole("link", { name: "Open in the reader" })[0]!
    expect(decodeURIComponent(cfiLink.getAttribute("href") ?? "")).toContain("loc=epubcfi(")
    expect(screen.getByText(/7 notes/)).toBeInTheDocument()
  })

  it("has no notebook action: notes are not a source", async () => {
    renderMy("notes")
    await screen.findByRole("region", { name: libDetails.bookPhysics10.title })

    expect(screen.queryByRole("button", { name: /notebook/i })).not.toBeInTheDocument()
  })

  it("searches the quotes and the notes", async () => {
    const { user } = renderMy("notes")
    await screen.findByRole("region", { name: libDetails.bookPhysics10.title })

    await user.type(screen.getByRole("searchbox", { name: "Search notes" }), "derivative")

    await waitFor(() =>
      expect(screen.queryByRole("region", { name: libDetails.bookOtkanKunlar.title })).not.toBeInTheDocument(),
    )
    expect(screen.getByText("Compare with the derivative from the maths lesson.")).toBeInTheDocument()
    expect(screen.getByText(/1 note/)).toBeInTheDocument()
  })

  it("says so when nothing matches", async () => {
    const { user } = renderMy("notes")
    await screen.findByRole("region", { name: libDetails.bookPhysics10.title })

    await user.type(screen.getByRole("searchbox", { name: "Search notes" }), "zzzzzz")

    expect(await screen.findByText("No notes match your search.")).toBeInTheDocument()
  })

  it("filters by colour", async () => {
    const { user } = renderMy("notes")
    await screen.findByRole("region", { name: libDetails.bookPhysics10.title })

    await user.click(screen.getByRole("button", { name: "Pink" }))

    await waitFor(() =>
      expect(screen.queryByRole("region", { name: libDetails.bookOtkanKunlar.title })).toBeInTheDocument(),
    )
    expect(screen.getByText("A net force produces acceleration.")).toBeInTheDocument()
    expect(screen.queryByText("The velocity of a body is the rate of change of its position.")).not.toBeInTheDocument()
  })

  it("invites to read when there are no notes at all", async () => {
    setLibraryActor({ id: "00000000-0000-4000-8000-0000000000ab", roles: ["student"], name: "New S." })
    renderMy("notes")

    expect(await screen.findByText(/No notes yet/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Export to Markdown" })).toBeDisabled()
  })

  it("exports all notes as a Markdown file", async () => {
    const blobs: Blob[] = []
    spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return "blob:notes"
    })
    spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)
    const downloads: string[] = []
    spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download)
    })
    const { user } = renderMy("notes")
    await screen.findByRole("region", { name: libDetails.bookPhysics10.title })

    await user.click(screen.getByRole("button", { name: "Export to Markdown" }))

    await waitFor(() => expect(downloads).toEqual(["Library-notes.md"]))
    const text = await blobs[0]!.text()
    expect(text).toContain("Physics 10: Mechanics")
    expect(text).toContain("The velocity of a body is the rate of change of its position.")
  })

  it("exports the notes of one item under the item's name", async () => {
    const blobs: Blob[] = []
    spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return "blob:notes"
    })
    spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)
    const downloads: string[] = []
    spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download)
    })
    const { user } = renderMy("notes")
    const physics = await screen.findByRole("region", { name: libDetails.bookPhysics10.title })

    await user.click(within(physics).getByRole("button", { name: "Export this item" }))

    await waitFor(() => expect(downloads).toEqual(["Physics-10-Mechanics.md"]))
    const text = await blobs[0]!.text()
    expect(text).toContain("Physics 10: Mechanics")
    expect(text).not.toContain("Отабек")
  })

  it("has no accessibility violations", async () => {
    const { container } = renderMy("notes")
    await screen.findByRole("region", { name: libDetails.bookPhysics10.title })

    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } })
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })
})

describe("MyLibraryPage: Lists and Uploads", () => {
  it("shows the reading lists of my groups", async () => {
    renderMy("lists")

    expect(await screen.findByRole("link", { name: libListPhysics.title })).toBeInTheDocument()
  })

  it("mounts My uploads", async () => {
    renderMy("uploads")

    expect(await screen.findByText(libDetails.matPending.title)).toBeInTheDocument()
  })
})
