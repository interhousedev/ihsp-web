import { describe, expect, it } from "bun:test"
import { selectDropdownValue, setLibraryActor, userMe } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { BooksPage } from "./books-page"

allowSlowRenders()

function renderBooks() {
  setLibraryActor("librarian")
  return renderLibrary(<BooksPage />, {
    route: "/manage/books/",
    session: { user: { ...userMe, roles: ["student", "librarian"] } },
  })
}

describe("BooksPage", () => {
  it("lists the books in a table with headers, status, visibility and text status", async () => {
    renderBooks()

    const table = await screen.findByRole("table")
    for (const name of ["Title", "Status", "Visibility", "Text", "Updated"]) {
      expect(within(table).getByRole("columnheader", { name: new RegExp(`^${name}`) })).toBeInTheDocument()
    }
    expect(within(table).getByRole("link", { name: /Physics 10: Mechanics/ })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/manage\/books\/edit\/?\?id=/),
    )
    const row = within(table).getByRole("row", { name: /Kimyo masalalari/ })
    expect(within(row).getByText("Draft")).toBeInTheDocument()
    expect(within(row).getByText("No text yet")).toBeInTheDocument()
  })

  it("filters by status and by a search word", async () => {
    const { user } = renderBooks()
    await screen.findByRole("link", { name: /Physics 10: Mechanics/ })

    await selectDropdownValue(user, screen.getByLabelText("Status"), "draft")
    await waitFor(() => expect(screen.queryByRole("link", { name: /Physics 10: Mechanics/ })).not.toBeInTheDocument())
    expect(screen.getByRole("link", { name: /Kimyo masalalari/ })).toBeInTheDocument()

    await selectDropdownValue(user, screen.getByLabelText("Status"), "")
    await user.type(screen.getByRole("searchbox", { name: "Search by title or author" }), "physics")
    await waitFor(() => expect(screen.queryByRole("link", { name: /Kimyo masalalari/ })).not.toBeInTheDocument())
    expect(screen.getByRole("link", { name: /Open Physics: Mechanics/ })).toBeInTheDocument()
  })

  it("says so when nothing matches", async () => {
    const { user } = renderBooks()
    await screen.findByRole("table")

    await user.type(screen.getByRole("searchbox", { name: "Search by title or author" }), "zzzzzz")

    expect(await screen.findByText("No books match this search.")).toBeInTheDocument()
  })

  it("sorts the loaded rows by a column header", async () => {
    const { user } = renderBooks()
    const table = await screen.findByRole("table")

    await user.click(within(table).getByRole("button", { name: "Title" }))

    const titles = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("link")[0]?.textContent ?? "")
    expect(titles.map((title) => title.replace(/: Edit$/, ""))).toEqual(
      titles
        .map((title) => title.replace(/: Edit$/, ""))
        .toSorted((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    )
    expect(within(table).getByRole("columnheader", { name: /Title/ })).toHaveAttribute("aria-sort", "ascending")
  })

  it("offers New book as a link to the editor", async () => {
    renderBooks()

    expect(await screen.findByRole("link", { name: "New book" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/manage\/books\/edit\/?$/),
    )
  })
})

describe("BooksPage: bulk import", () => {
  it("uploads a CSV, imports it and lists the created count and the rows with errors", async () => {
    const { user } = renderBooks()
    await screen.findByRole("table")

    await user.click(screen.getByRole("button", { name: "Bulk import" }))
    const dialog = await screen.findByRole("dialog", { name: "Bulk import of books" })
    expect(within(dialog).getByRole("button", { name: "Import" })).toBeDisabled()

    fireEvent.change(within(dialog).getByTestId("upload-zone-input"), {
      target: { files: [new File(["title,authors\n"], "books.csv", { type: "text/csv" })] },
    })
    expect(await within(dialog).findByText("Ready to import: books.csv")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Import" }))

    expect(await within(dialog).findByText("2 draft books were created.")).toBeInTheDocument()
    expect(within(dialog).getByText("1 row has an error and was skipped.")).toBeInTheDocument()
    const row = within(dialog).getByRole("row", { name: /Missing rights class/ })
    expect(within(row).getByText("4")).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Done" }))
    await waitFor(() => expect(screen.getAllByRole("link", { name: /Imported book/ }).length).toBe(2))
  })

  it("refuses a file that is not a CSV before it is uploaded", async () => {
    const { user } = renderBooks()
    await screen.findByRole("table")
    await user.click(screen.getByRole("button", { name: "Bulk import" }))
    const dialog = await screen.findByRole("dialog", { name: "Bulk import of books" })

    fireEvent.change(within(dialog).getByTestId("upload-zone-input"), {
      target: { files: [new File(["x"], "books.pdf", { type: "application/pdf" })] },
    })

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("This file type is not accepted. Use .csv.")
    expect(within(dialog).getByRole("button", { name: "Import" })).toBeDisabled()
  })
})
