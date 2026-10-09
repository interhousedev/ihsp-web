import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import { libDetails, libIds, setLibraryActor, testRouter, userMe } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import axe from "axe-core"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { BookEditorPage } from "./book-editor-page"

allowSlowRenders()

function renderEditor(query: string) {
  setLibraryActor("librarian")
  return renderLibrary(<BookEditorPage />, {
    route: `/manage/books/edit/${query}`,
    session: { user: { ...userMe, roles: ["student", "librarian"] } },
  })
}
const editBook = (id: string) => renderEditor(`?id=${id}`)

const checklistItem = (name: RegExp) => screen.getByText(name).closest("li") as HTMLElement

afterEach(() => {
  mock.restore()
})

describe("BookEditor: a saved book", () => {
  it("loads the book into the form and shows a green checklist for a complete one", async () => {
    editBook(libIds.bookGhazals)

    expect(await screen.findByDisplayValue("Gʻazallar")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Gʻazallar" })).toBeInTheDocument()
    expect(await screen.findByText("Everything is ready. You can publish.")).toBeInTheDocument()
    expect(screen.getByText("Public domain since 1572")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Unpublish" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Take down" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument()
  })

  it("shows what is missing for an incomplete draft, and the API's list after Publish", async () => {
    const { user } = editBook(libIds.bookDraft)
    await screen.findByDisplayValue("Kimyo masalalari")

    await waitFor(() => expect(checklistItem(/Rights are complete/)).toHaveAttribute("data-ok", "false"))
    expect(checklistItem(/Cover is present/)).toHaveAttribute("data-ok", "false")
    expect(checklistItem(/The file has been checked/)).toHaveAttribute("data-ok", "false")
    expect(checklistItem(/^At least one subject$/)).toHaveAttribute("data-ok", "true")

    await user.click(screen.getByRole("button", { name: "Publish" }))

    const rights = checklistItem(/Rights are complete/)
    expect(await within(rights).findByText("Licence")).toBeInTheDocument()
    expect(within(rights).getByText("Link to the licence statement")).toBeInTheDocument()
    expect(within(rights).getByText("Attribution text")).toBeInTheDocument()
  })

  it("unpublishes and publishes a complete book again", async () => {
    const { user } = editBook(libIds.bookGhazals)
    await screen.findByDisplayValue("Gʻazallar")

    await user.click(await screen.findByRole("button", { name: "Unpublish" }))
    expect(await screen.findByText("Removed")).toBeInTheDocument()

    await user.click(await screen.findByRole("button", { name: "Publish" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Unpublish" })).toBeInTheDocument())
    expect(screen.getByText("Published", { selector: "[data-slot=badge]" })).toBeInTheDocument()
  })

  it("needs a reason to take a book down", async () => {
    const { user } = editBook(libIds.bookGhazals)
    await user.click(await screen.findByRole("button", { name: "Take down" }))

    const dialog = await screen.findByRole("dialog", { name: "Take this book down" })
    await user.click(within(dialog).getByRole("button", { name: "Take down" }))
    expect(await within(dialog).findByText("Write a reason. The owner will see it.")).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText("Reason"), "The rights holder asked for it")
    await user.click(within(dialog).getByRole("button", { name: "Take down" }))

    expect(await screen.findByText("Removed")).toBeInTheDocument()
    expect(screen.getByText(/The rights holder asked for it/)).toBeInTheDocument()
  })

  it("shows an unsaved-changes indicator, saves, and asks before a link leaves the page", async () => {
    const { user } = editBook(libIds.bookGhazals)
    const title = await screen.findByDisplayValue("Gʻazallar")
    expect(screen.getByText("All changes are saved.")).toBeInTheDocument()

    await user.type(title, " (tanlangan)")
    expect(await screen.findByText("Unsaved changes")).toBeInTheDocument()

    const confirm = spyOn(window, "confirm").mockReturnValue(false)
    fireEvent.click(screen.getByRole("link", { name: "Back to books" }))
    expect(confirm).toHaveBeenCalledWith("You have unsaved changes. Leave this page?")

    await user.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument())
    expect(screen.getByText("All changes are saved.")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Gʻazallar (tanlangan)")).toBeInTheDocument()
  })

  it("shows the not-available page for a book that does not exist", async () => {
    editBook("00000000-0000-4000-8000-00000000dead")

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
  })
})

describe("BookEditor: files", () => {
  it("attaches an uploaded PDF to a saved book and lists it", async () => {
    editBook(libIds.bookDraft)
    await screen.findByDisplayValue("Kimyo masalalari")
    expect(screen.getByText("No file yet.")).toBeInTheDocument()

    const zone = screen.getByRole("group", { name: "Book file" })
    fireEvent.change(within(zone).getByTestId("upload-zone-input"), {
      target: { files: [new File(["%PDF-1.4"], "chem.pdf", { type: "application/pdf" })] },
    })

    expect(await screen.findByText("pdf")).toBeInTheDocument()
    expect(screen.queryByText("No file yet.")).not.toBeInTheDocument()
  })

  it("holds a file chosen for a new book until the book is created, then attaches it", async () => {
    const { user } = renderEditor("?title=With%20file")
    await screen.findByDisplayValue("With file")
    await user.type(screen.getByLabelText(/^Authors/), "A. Author{Enter}")

    const zone = screen.getByRole("group", { name: "Book file" })
    fireEvent.change(within(zone).getByTestId("upload-zone-input"), {
      target: { files: [new File(["%PDF-1.4"], "new.pdf", { type: "application/pdf" })] },
    })
    expect(await screen.findByText(/new\.pdf is uploaded and will be attached/)).toBeInTheDocument()
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Create book" }))
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalled())
  })

  it("refuses a book file that is not a PDF or EPUB", async () => {
    editBook(libIds.bookDraft)
    await screen.findByDisplayValue("Kimyo masalalari")

    const zone = screen.getByRole("group", { name: "Book file" })
    fireEvent.change(within(zone).getByTestId("upload-zone-input"), {
      target: { files: [new File(["x"], "notes.docx", { type: "application/msword" })] },
    })

    expect(await within(zone).findByRole("alert")).toHaveTextContent("This file type is not accepted. Use .pdf, .epub.")
  })
})

describe("BookEditor: a new book", () => {
  it("prefills the title from the address and creates the book, then moves to its address", async () => {
    const { user } = renderEditor("?title=Atom%20physics%20workbook")
    const title = await screen.findByDisplayValue("Atom physics workbook")
    expect(title).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "New book" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create book" })).toBeDisabled()

    await user.type(screen.getByLabelText(/^Authors/), "A. Author{Enter}")
    await user.click(screen.getByRole("button", { name: "Create book" }))

    await waitFor(() => expect(testRouter.replace).toHaveBeenCalled())
    expect(String(testRouter.replace.mock.calls[0]?.[0])).toMatch(/^\/manage\/books\/edit\/?\?id=/)
  })

  it("computes 'Public domain since' from the death year and refuses a year that is not free yet", async () => {
    const { user } = renderEditor("")
    const year = await screen.findByLabelText(/^Year the author died/)

    await user.type(year, "1938")
    expect(await screen.findByText("Public domain since 2009")).toBeInTheDocument()

    await user.clear(year)
    await user.type(year, "2000")
    expect(
      await screen.findByText(/not in the public domain yet\. It becomes free on 1 January 2071/),
    ).toBeInTheDocument()
    expect(screen.queryByText(/^Public domain since/)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create book" })).toBeDisabled()
  })

  it("uses the 51-year rule for an anonymous work", async () => {
    const { user } = renderEditor("")
    await user.click(await screen.findByRole("radio", { name: "Anonymous work: year of first publication" }))

    await user.type(screen.getByLabelText(/^Year of first publication/), "1950")

    expect(await screen.findByText("Public domain since 2001")).toBeInTheDocument()
  })

  it("changes the rights fields with the class and keeps public visibility for the classes that allow it", async () => {
    const { user } = renderEditor("")
    await screen.findByRole("radio", { name: /Public domain/ })

    await user.click(screen.getByRole("radio", { name: /Open licence/ }))
    expect(screen.getByLabelText(/^Licence/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Link to the licence statement/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Attribution text/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Year the author died/)).not.toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: /^Public\s+Anyone/ }))
    expect(screen.getByRole("radio", { name: /^Public\s+Anyone/ })).toBeChecked()

    await user.click(screen.getByRole("radio", { name: /Permission of the rights holder/ }))
    expect(screen.getByRole("group", { name: "Proof of permission" })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Scope of the permission/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Permission expires on/)).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^Public\s+Anyone/ })).toBeDisabled()
    expect(screen.getByRole("radio", { name: /^Lyceum only\s+Signed-in/ })).toBeChecked()

    await user.click(screen.getByRole("radio", { name: /Official textbook/ }))
    expect(screen.getByLabelText(/^Reference/)).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^Public\s+Anyone/ })).toBeDisabled()
  })

  it("shows the local checklist for a book that is not saved yet", async () => {
    renderEditor("")

    await screen.findByRole("heading", { name: "Publish checklist" })
    expect(checklistItem(/Rights are complete/)).toHaveAttribute("data-ok", "false")
    expect(checklistItem(/Cover is present/)).toHaveAttribute("data-ok", "false")
    expect(checklistItem(/^At least one subject$/)).toHaveAttribute("data-ok", "false")
  })
})

describe("BookEditor: accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = editBook(libIds.bookOpenPhysics)
    await screen.findByDisplayValue(libDetails.bookOpenPhysics.title)
    await screen.findByText("Everything is ready. You can publish.")

    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } })

    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
  })
})
