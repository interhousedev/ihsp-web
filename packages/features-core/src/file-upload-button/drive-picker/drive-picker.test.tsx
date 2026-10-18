import { describe, expect, it, mock, setDefaultTimeout } from "bun:test"
import type { FileItem } from "@ihsp/api"
import { apiUrl, fileImage, filePdf, renderWithProviders, server, setDropdownValue } from "@ihsp/test-utils"
import { configure, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { formatFileSize } from "./file-kind"
import { DrivePicker } from "./drive-picker"

configure({ asyncUtilTimeout: 8000 })
setDefaultTimeout(30_000)

function files(count: number, from = 0): FileItem[] {
  return Array.from({ length: count }, (_, index) => ({
    ...filePdf,
    id: `00000000-0000-4000-8000-0000000002${String(from + index).padStart(2, "0")}`,
    name: `file-${from + index}.pdf`,
  }))
}

function listing(all: FileItem[], seen: URLSearchParams[] = []) {
  return http.get(apiUrl("/v1/me/files"), ({ request }) => {
    const search = new URL(request.url).searchParams
    seen.push(search)
    const page = Number(search.get("page") ?? 1)
    const size = Number(search.get("page_size") ?? 20)
    return HttpResponse.json({
      items: all.slice((page - 1) * size, page * size),
      next_cursor: page * size < all.length ? String(page + 1) : null,
    })
  })
}

function renderPicker(props: { multiple?: boolean } = {}) {
  const onSelect = mock((_files: FileItem[]) => undefined)
  renderWithProviders(<DrivePicker open onOpenChange={() => undefined} onSelect={onSelect} {...props} />, {})
  return onSelect
}

describe("DrivePicker", () => {
  it("lists my files, previews the clicked one and returns it on Select", async () => {
    server.use(listing(files(3)))
    const onSelect = renderPicker()

    const first = await screen.findByRole("button", { name: "file-0.pdf" })
    expect(screen.getByRole("button", { name: "Select" })).toBeDisabled()
    fireEvent.click(first)

    expect(await screen.findByTestId("drive-preview")).toHaveTextContent("file-0.pdf")
    expect(screen.getByText("1 selected")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Select" }))
    expect(onSelect.mock.calls[0]?.[0]?.map((file) => file.name)).toEqual(["file-0.pdf"])
  })

  it("a single pick replaces the previous one; multi-select keeps several", async () => {
    server.use(listing(files(3)))
    const onSelect = renderPicker({ multiple: true })

    fireEvent.click(await screen.findByRole("button", { name: "file-0.pdf" }))
    fireEvent.click(screen.getByRole("button", { name: "file-2.pdf" }))
    expect(screen.getByText("2 selected")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "file-0.pdf" }))
    expect(screen.getByText("1 selected")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "file-0.pdf" }))
    fireEvent.click(screen.getByRole("button", { name: "Select" }))
    expect(onSelect.mock.calls[0]?.[0]?.map((file) => file.name)).toEqual(["file-2.pdf", "file-0.pdf"])
  })

  it("sends the name, the type group and the order to the server, 24 files per page", async () => {
    const seen: URLSearchParams[] = []
    server.use(listing(files(3), seen))
    renderPicker()
    await screen.findByRole("button", { name: "file-0.pdf" })
    expect(seen[0]?.get("page_size")).toBe("24")
    expect(seen[0]?.get("page")).toBe("1")

    setDropdownValue(screen.getByLabelText("Search by name"), "report")
    await waitFor(() => expect(seen.some((search) => search.get("q") === "report")).toBe(true))

    setDropdownValue(screen.getByLabelText("File type"), "video")
    await waitFor(() => expect(seen.some((search) => search.get("type") === "video")).toBe(true))
    setDropdownValue(screen.getByLabelText("File type"), "documents")
    await waitFor(() => expect(seen.some((search) => search.get("type") === "doc")).toBe(true))

    setDropdownValue(screen.getByLabelText("Order"), "older")
    await waitFor(() => expect(seen.some((search) => search.get("sort") === "older")).toBe(true))
  })

  it("loads the next page of 24 on Load more", async () => {
    server.use(listing(files(30)))
    renderPicker()
    await screen.findByRole("button", { name: "file-0.pdf" })
    expect(screen.getAllByRole("button", { name: /^file-/ })).toHaveLength(24)

    fireEvent.click(screen.getByRole("button", { name: "Load more" }))

    await screen.findByRole("button", { name: "file-29.pdf" })
    expect(screen.getAllByRole("button", { name: /^file-/ })).toHaveLength(30)
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument()
  })

  it("switches between grid and list", async () => {
    server.use(listing(files(2)))
    renderPicker()
    await screen.findByRole("button", { name: "file-0.pdf" })
    expect(screen.getByRole("button", { name: "Grid" })).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(screen.getByRole("button", { name: "List" }))
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "file-0.pdf" })).toBeInTheDocument()
  })

  it("a file uploaded inside the picker appears selected", async () => {
    server.use(listing([]))
    const onSelect = renderPicker()
    await screen.findByText("No files found.")

    const input = screen.getByTestId("file-upload-input")
    fireEvent.change(input, {
      target: { files: [new File(["hello world"], "fresh.pdf", { type: "application/pdf" })] },
    })

    await waitFor(() => expect(screen.getByText("1 selected")).toBeInTheDocument())
    expect(screen.getByTestId("drive-preview")).toHaveTextContent("fresh.pdf")
    fireEvent.click(screen.getByRole("button", { name: "Select" }))
    expect(onSelect.mock.calls[0]?.[0]?.[0]).toMatchObject({ name: "fresh.pdf", status: "ready" })
  })

  it("a file dropped on the list is uploaded and selected", async () => {
    server.use(listing([]))
    renderPicker()
    await screen.findByText("No files found.")

    fireEvent.drop(screen.getByTestId("drive-dropzone"), {
      dataTransfer: { files: [new File(["dropped"], "dropped.pdf", { type: "application/pdf" })] },
    })

    await waitFor(() => expect(screen.getByText("1 selected")).toBeInTheDocument())
  })

  it("previews an image as a thumbnail, and any other file as its icon with name, size and type", async () => {
    const image: FileItem = { ...fileImage, name: "lab-setup.jpg" }
    server.use(listing([image, ...files(1)]))
    renderPicker()

    fireEvent.click(await screen.findByRole("button", { name: "lab-setup.jpg" }))
    const thumb = await within(await screen.findByTestId("drive-preview")).findByRole("img", { name: "lab-setup.jpg" })
    expect(thumb.getAttribute("src")).toContain("disposition=inline")

    fireEvent.click(screen.getByRole("button", { name: "file-0.pdf" }))
    await waitFor(() => expect(screen.getByTestId("drive-preview")).toHaveTextContent("file-0.pdf"))
    const preview = screen.getByTestId("drive-preview")
    expect(preview.querySelector("img")).toBeNull()
    expect(preview.querySelector("iframe")).toBeNull()
    expect(within(preview).getByText(formatFileSize(filePdf.byte_size))).toBeInTheDocument()
    expect(within(preview).getByText("application/pdf")).toBeInTheDocument()
  })

  it("the preview comes after the list in the page, so on a phone it sits below the list", async () => {
    server.use(listing(files(2)))
    renderPicker()

    const list = await screen.findByRole("list", { name: "Files" })
    const preview = screen.getByRole("complementary", { name: "Preview" })
    expect(preview).not.toHaveClass("hidden")
    // DOCUMENT_POSITION_FOLLOWING: the preview is after the list.
    expect(list.compareDocumentPosition(preview) & 4).toBe(4)
  })
})
