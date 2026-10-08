import { describe, expect, it, mock, setDefaultTimeout } from "bun:test"
import type { FileItem } from "@ihsp/api"
import { TEST_STORAGE_URL, apiUrl, filePdf, problem, renderWithProviders, server } from "@ihsp/test-utils"
import { configure, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { FileUploadButton } from "./file-upload-button"

configure({ asyncUtilTimeout: 8000 })
setDefaultTimeout(30_000)

function renderButton() {
  const onUploaded = mock((_file: FileItem) => undefined)
  const onSettled = mock((_file: FileItem | null) => undefined)
  renderWithProviders(<FileUploadButton purpose="ai_upload" onUploaded={onUploaded} onSettled={onSettled} />, {})
  return { onUploaded, onSettled }
}

function choose(name: string, type = "application/pdf") {
  const input = screen.getByTestId("file-upload-input")
  fireEvent.change(input, { target: { files: [new File(["hello world"], name, { type })] } })
}

describe("FileUploadButton (FILE-2, UF-WEB-18)", () => {
  it("shows a progress bar while the file is on its way and reports the finished file", async () => {
    const { promise: gate, resolve: release } = Promise.withResolvers<void>()
    server.use(
      http.put(`${TEST_STORAGE_URL}/uploads/:id`, async () => {
        await gate
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const { onUploaded, onSettled } = renderButton()

    choose("notes.pdf")

    const bar = await screen.findByRole("progressbar", { name: "Uploading notes.pdf" })
    expect(bar).toBeInTheDocument()
    expect(onUploaded).not.toHaveBeenCalled()

    release()

    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1))
    expect(onUploaded.mock.calls[0]?.[0]).toMatchObject({ name: "notes.pdf", status: "ready" })
    expect(onSettled).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument())
  })

  it("uploads several files, each with its own row", async () => {
    const { onUploaded } = renderButton()
    const input = screen.getByTestId("file-upload-input")

    fireEvent.change(input, {
      target: {
        files: [
          new File(["a"], "one.pdf", { type: "application/pdf" }),
          new File(["b"], "two.txt", { type: "text/plain" }),
        ],
      },
    })

    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(2))
    expect(onUploaded.mock.calls.map((call) => call[0].name).toSorted()).toEqual(["one.pdf", "two.txt"])
  })

  it("shows the reason when the backend refuses the file type", async () => {
    const { onUploaded, onSettled } = renderButton()

    choose("installer.exe", "application/x-msdownload")

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("This type of file is not allowed.")
    expect(screen.getByText("installer.exe")).toBeInTheDocument()
    expect(onUploaded).not.toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledWith(null)
  })

  it("shows the reason when the storage is full", async () => {
    server.use(http.post(apiUrl("/v1/files"), () => problem(413, "files/quota-exceeded", "Quota exceeded")))
    renderButton()

    choose("big.pdf")

    expect(await screen.findByRole("alert")).toHaveTextContent("Your file storage is full")
  })

  it("shows the reject reason of a file that failed the check after the upload", async () => {
    server.use(
      http.post(apiUrl("/v1/files/:id/complete"), () =>
        HttpResponse.json({
          ...filePdf,
          id: "0000000a-0000-4000-8000-0000000000ff",
          name: "fake.pdf",
          status: "rejected",
          reject_reason: "type_mismatch",
          assistant_ready: false,
        }),
      ),
    )
    const { onUploaded, onSettled } = renderButton()

    choose("fake.pdf")

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Rejected: the content does not match the file type")
    expect(onUploaded).not.toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledTimes(1)
  })

  it("lets the student dismiss a failed upload", async () => {
    const { onSettled } = renderButton()
    choose("installer.exe", "application/x-msdownload")
    const alert = await screen.findByRole("alert")
    expect(onSettled).toHaveBeenCalled()

    fireEvent.click(within(alert.closest("li") as HTMLElement).getByRole("button", { name: "Dismiss" }))

    await waitFor(() => expect(screen.queryByText("installer.exe")).not.toBeInTheDocument())
  })
})
