import { describe, expect, it } from "bun:test"
import { apiUrl, libDetails, libIds, server } from "@ihsp/test-utils"
import { HttpResponse, http } from "msw"
import { screen, waitFor } from "@testing-library/react"
import { allowSlowRenders, renderLibrary, renderLibraryAnonymous } from "../test-support"
import { AddToNotebookButton } from "./add-to-notebook"
import { asSourcesBody, libraryItemSource, parsePage } from "./library-source"

allowSlowRenders()

const physics = libDetails.bookPhysics10
const file = physics.files[0]!

describe("library item as a notebook source", () => {
  it("builds the library_item ref with an optional page range", () => {
    expect(libraryItemSource({ itemId: "i", fileId: "f" })).toEqual({
      kind: "library_item",
      item_id: "i",
      file_id: "f",
    })
    expect(libraryItemSource({ itemId: "i", fileId: "f", pageFrom: 3, pageTo: 9 })).toEqual({
      kind: "library_item",
      item_id: "i",
      file_id: "f",
      page_from: 3,
      page_to: 9,
    })
    expect(asSourcesBody([libraryItemSource({ itemId: "i", fileId: "f" })]).items).toHaveLength(1)
  })

  it("parses page inputs", () => {
    expect(parsePage("12")).toBe(12)
    expect(parsePage("")).toBeNull()
    expect(parsePage("0")).toBeNull()
    expect(parsePage("1.5")).toBeNull()
    expect(parsePage("x")).toBeNull()
  })
})

describe("AddToNotebookButton", () => {
  it("opens a dialog with a notebook picker and the page range choice", async () => {
    const { user } = renderLibrary(
      <AddToNotebookButton
        itemId={libIds.bookPhysics10}
        fileId={file.id}
        title={physics.title}
        pageCount={file.pages}
        toc={file.toc}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Add to notebook" }))

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByLabelText("Notebook")).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Whole item" })).toBeChecked()
    await user.click(screen.getByRole("radio", { name: "Pages" }))
    expect(screen.getByLabelText("From page")).toBeInTheDocument()
    expect(screen.getByLabelText("To page")).toBeInTheDocument()
  })

  it("fills the range from a chapter of the contents", async () => {
    const { user } = renderLibrary(
      <AddToNotebookButton
        itemId={libIds.bookPhysics10}
        fileId={file.id}
        title={physics.title}
        pageCount={file.pages}
        toc={file.toc}
      />,
    )
    await user.click(screen.getByRole("button", { name: "Add to notebook" }))
    await user.click(await screen.findByRole("radio", { name: "Pages" }))

    await user.selectOptions(screen.getByLabelText("Chapters"), "1")

    expect((screen.getByLabelText("From page") as HTMLInputElement).value).not.toBe("")
    expect((screen.getByLabelText("To page") as HTMLInputElement).value).not.toBe("")
  })

  it("adds the item to a new notebook and closes", async () => {
    // The notebooks mock does not know the library_item kind (the backend bridge comes later): record the request.
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/notebooks/:id/sources"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ items: [], rejected: [] }, { status: 201 })
      }),
    )
    const { user } = renderLibrary(
      <AddToNotebookButton itemId={libIds.bookPhysics10} fileId={file.id} title={physics.title} />,
    )
    await user.click(screen.getByRole("button", { name: "Add to notebook" }))
    await user.click(await screen.findByRole("button", { name: "Add" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(bodies).toEqual([{ items: [{ kind: "library_item", item_id: libIds.bookPhysics10, file_id: file.id }] }])
  })

  it("explains that a scan without text cannot be used", async () => {
    const { user } = renderLibrary(
      <AddToNotebookButton itemId={libIds.bookGeometryScan} fileId="f" title="Scan" noText />,
    )
    await user.click(screen.getByRole("button", { name: "Add to notebook" }))

    expect(await screen.findByText(/scan without text/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument()
  })

  it("sends a visitor to sign in", async () => {
    renderLibraryAnonymous(<AddToNotebookButton itemId={libIds.bookPhysics10} fileId={file.id} title={physics.title} />)

    expect(await screen.findByRole("button", { name: "Sign in to use notebooks." })).toBeInTheDocument()
  })
})
