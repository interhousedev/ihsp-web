import { describe, expect, it, mock } from "bun:test"
import { TEST_STORAGE_URL, apiUrl, fileImage, filePdf, ids, problem, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, enter, readBody, renderTools } from "../../assistant/utils/tools-test-utils"
import { formatBytes, opensInline, quotaPercent } from "../utils/format-bytes"
import { FilesPage } from "./files-page"

allowSlowRenders()

function rowOf(name: string): HTMLElement {
  return screen.getByRole("heading", { name }).closest("[data-file-id]") as HTMLElement
}

/** Opens the "More actions" menu of a file and picks one of its items. */
async function pickMoreAction(user: ReturnType<typeof renderTools>["user"], name: string, item: string) {
  await user.click(screen.getByRole("button", { name: `More actions for ${name}` }))
  await user.click(await screen.findByRole("menuitem", { name: item }))
}

/** Opens the settings menu and its storage dialog. */
async function openStorage(user: ReturnType<typeof renderTools>["user"]): Promise<HTMLElement> {
  await user.click(screen.getByRole("button", { name: "Settings" }))
  await user.click(await screen.findByRole("menuitem", { name: "Storage" }))
  return await screen.findByRole("dialog")
}

describe("FilesPage: header, filters and views", () => {
  it("shows the title, the search and the grid or list toggle", async () => {
    renderTools(<FilesPage />, { route: "/files/" })

    expect(await screen.findByRole("heading", { name: "My files" })).toBeInTheDocument()
    expect(screen.getByRole("searchbox", { name: "Search by name" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Grid" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "false")
  })

  it("switches between the grid and the list view", async () => {
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    expect(screen.getByRole("list", { name: "Files" })).toHaveAttribute("data-view", "grid")
    await user.click(screen.getByRole("button", { name: "List" }))

    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("list", { name: "Files" })).toHaveAttribute("data-view", "list")
  })

  it("filters the files by the pill tabs through the server", async () => {
    const purposes: string[] = []
    server.use(
      http.get(apiUrl("/v1/me/files"), ({ request }) => {
        purposes.push(new URL(request.url).searchParams.get("purpose") ?? "all")
        return HttpResponse.json({ items: [], next_cursor: null })
      }),
    )
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByText("No files yet. Upload your first file.")

    await user.click(screen.getByRole("button", { name: "Links" }))

    await waitFor(() => expect(purposes).toContain("link"))
    expect(screen.getByRole("button", { name: "Links" })).toHaveAttribute("aria-pressed", "true")
  })

  it("searches the files by name on the server", async () => {
    const queries: string[] = []
    server.use(
      http.get(apiUrl("/v1/me/files"), ({ request }) => {
        const q = new URL(request.url).searchParams.get("q")
        if (q) queries.push(q)
        return HttpResponse.json({ items: [], next_cursor: null })
      }),
    )
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByText("No files yet. Upload your first file.")

    await user.type(screen.getByRole("searchbox", { name: "Search by name" }), "kine")

    await waitFor(() => expect(queries).toContain("kine"))
    expect(await screen.findByText("No files found.")).toBeInTheDocument()
  })

  it("filters the files by file type from the filter menu", async () => {
    const types: string[] = []
    server.use(
      http.get(apiUrl("/v1/me/files"), ({ request }) => {
        const type = new URL(request.url).searchParams.get("type")
        if (type) types.push(type)
        return HttpResponse.json({ items: [], next_cursor: null })
      }),
    )
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByText("No files yet. Upload your first file.")

    await user.click(screen.getByRole("button", { name: "Filter" }))
    await user.click(await screen.findByRole("menuitemradio", { name: "Images" }))

    await waitFor(() => expect(types).toContain("image"))
  })

  it("offers upload in the New menu and no folder or trash actions", async () => {
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    await user.click(screen.getByRole("button", { name: "New" }))

    expect(await screen.findByRole("menuitem", { name: "Upload files" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: /folder/i })).not.toBeInTheDocument()
  })

  it("shows storage from the settings menu, with no trash", async () => {
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    await user.click(screen.getByRole("button", { name: "Settings" }))

    expect(await screen.findByRole("menuitem", { name: "Storage" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Trash" })).not.toBeInTheDocument()
  })
})

describe("FilesPage: quota and list (UF-WEB-18, WEB-21, FILE-5, FILE-6)", () => {
  it("shows the quota bar and the date this term's files are deleted", async () => {
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    const dialog = await openStorage(user)

    expect(await within(dialog).findByText("3.7 MB of 50 MB")).toBeInTheDocument()
    expect(within(dialog).getByRole("progressbar", { name: "Storage used" })).toBeInTheDocument()
    expect(within(dialog).getByText("Files of this term are deleted on 15 Jan 2027.")).toBeInTheDocument()
  })

  it("warns when the storage is almost full", async () => {
    server.use(
      http.get(apiUrl("/v1/me/storage"), () =>
        HttpResponse.json({
          used_bytes: 1_500_000_000,
          quota_bytes: 1_610_612_736,
          term_id: ids.term,
          expires_on: null,
        }),
      ),
    )
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    const dialog = await openStorage(user)

    expect(await within(dialog).findByText("Almost full. Delete files you do not need.")).toBeInTheDocument()
    expect(within(dialog).getByText("1.4 GB of 1.5 GB")).toBeInTheDocument()
  })

  it("lists the files with their status and where they are used", async () => {
    renderTools(<FilesPage />, { route: "/files/" })

    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    const pdf = rowOf("kinematics-notes.pdf")
    expect(within(pdf).getByText("Ready for assistant")).toBeInTheDocument()
    expect(within(pdf).getByText("Chat: Kinematics revision")).toBeInTheDocument()
    expect(await within(pdf).findByText("Lesson: Physics, 7 October")).toBeInTheDocument()
    expect(within(rowOf("installer.exe")).getByText("Rejected: This type of file is not allowed.")).toBeInTheDocument()
    expect(within(rowOf("lab-setup.jpg")).getByText("Link: lab-setup.jpg")).toBeInTheDocument()
  })

  it("marks a text file over the assistant's limit as too large", async () => {
    server.use(
      http.get(apiUrl("/v1/me/files"), () =>
        HttpResponse.json({
          items: [{ ...filePdf, name: "big-book.pdf", text_bytes: 400_000, assistant_ready: false, used_by: [] }],
          next_cursor: null,
        }),
      ),
    )
    renderTools(<FilesPage />, { route: "/files/" })

    expect(await screen.findByText("Too large for assistant")).toBeInTheDocument()
  })

  it("shows files that are being checked and keeps refreshing them", async () => {
    let calls = 0
    server.use(
      http.get(apiUrl("/v1/me/files"), () => {
        calls += 1
        const status = calls === 1 ? "processing" : "ready"
        return HttpResponse.json({
          items: [{ ...filePdf, status, assistant_ready: status === "ready" }],
          next_cursor: null,
        })
      }),
    )
    renderTools(<FilesPage />, { route: "/files/" })

    expect(await screen.findByText("Checking…")).toBeInTheDocument()
    expect(await screen.findByText("Ready for assistant", undefined, { timeout: 8000 })).toBeInTheDocument()
  })

  it("shows an empty state", async () => {
    server.use(http.get(apiUrl("/v1/me/files"), () => HttpResponse.json({ items: [], next_cursor: null })))
    renderTools(<FilesPage />, { route: "/files/" })

    expect(await screen.findByText("No files yet. Upload your first file.")).toBeInTheDocument()
  })

  it("loads more files when there is another page", async () => {
    server.use(
      http.get(apiUrl("/v1/me/files"), ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor")
        return cursor
          ? HttpResponse.json({
              items: [{ ...fileImage, id: ids.fileRejected, name: "second-page.jpg" }],
              next_cursor: null,
            })
          : HttpResponse.json({ items: [filePdf], next_cursor: "50" })
      }),
    )
    const { user } = renderTools(<FilesPage />, { route: "/files/" })

    await user.click(await screen.findByRole("button", { name: "Load more" }))

    expect(await screen.findByRole("heading", { name: "second-page.jpg" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument()
  })

  it("shows an error with a retry", async () => {
    server.use(http.get(apiUrl("/v1/me/files"), () => HttpResponse.error()))
    renderTools(<FilesPage />, { route: "/files/" })

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})

describe("FilesPage: upload (UF-WEB-18 step 2)", () => {
  it("uploads several files and lists them once they are ready", async () => {
    renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    fireEvent.change(screen.getByTestId("file-upload-input"), {
      target: {
        files: [
          new File(["one"], "chapter-1.pdf", { type: "application/pdf" }),
          new File(["two"], "chapter-2.txt", { type: "text/plain" }),
        ],
      },
    })

    expect(await screen.findByRole("heading", { name: "chapter-1.pdf" })).toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "chapter-2.txt" })).toBeInTheDocument()
  })

  it("uploads files dropped on the list", async () => {
    renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    fireEvent.drop(screen.getByTestId("files-dropzone"), {
      dataTransfer: { files: [new File(["d"], "dropped.pdf", { type: "application/pdf" })] },
    })

    expect(await screen.findByRole("heading", { name: "dropped.pdf" })).toBeInTheDocument()
  })

  it("shows a progress bar for an upload that is still running", async () => {
    const { promise: gate, resolve: release } = Promise.withResolvers<void>()
    server.use(
      http.put(`${TEST_STORAGE_URL}/uploads/:id`, async () => {
        await gate
        return new HttpResponse(null, { status: 200 })
      }),
    )
    renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    fireEvent.change(screen.getByTestId("file-upload-input"), {
      target: { files: [new File(["slow"], "slow.pdf", { type: "application/pdf" })] },
    })

    expect(await screen.findByRole("progressbar", { name: "Uploading slow.pdf" })).toBeInTheDocument()
    release()
    expect(await screen.findByRole("heading", { name: "slow.pdf" })).toBeInTheDocument()
  })

  it("tells the student to free space when the quota is exceeded", async () => {
    server.use(http.post(apiUrl("/v1/files"), () => problem(413, "files/quota-exceeded", "Quota exceeded")))
    renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    fireEvent.change(screen.getByTestId("file-upload-input"), {
      target: { files: [new File(["x"], "huge.pdf", { type: "application/pdf" })] },
    })

    expect(await screen.findByText(/Your file storage is full\. Delete some files/)).toBeInTheDocument()
  })
})

describe("FilesPage: rename, share, download, delete (UF-WEB-18 step 4)", () => {
  it("renames a file", async () => {
    let body: unknown
    server.use(
      http.patch(apiUrl(`/v1/files/${ids.file}`), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({ ...filePdf, name: "kinematics-final.pdf" })
      }),
    )
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    await pickMoreAction(user, "kinematics-notes.pdf", "Rename")
    const dialog = await screen.findByRole("dialog")
    const input = within(dialog).getByLabelText("Name")
    await user.clear(input)
    await enter(user, input, "kinematics-final.pdf")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(body).toEqual({ name: "kinematics-final.pdf" }))
  })

  it("shares a file as a link and copies it", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/links"), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({ id: ids.file, url: "https://ihsp.test/s/abc" }, { status: 201 })
      }),
    )
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    await pickMoreAction(user, "kinematics-notes.pdf", "Share")

    await waitFor(() => expect(body).toEqual({ kind: "file", file_id: ids.file }))
  })

  it("opens a PDF inline through a presigned URL", async () => {
    const open = mock((_url?: string | URL) => null)
    window.open = open as unknown as typeof window.open
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    await user.click(within(rowOf("kinematics-notes.pdf")).getByRole("button", { name: "Download" }))

    await waitFor(() => expect(open).toHaveBeenCalledTimes(1))
    expect(String(open.mock.calls[0]?.[0])).toContain(`/files/${ids.file}?disposition=inline`)
  })

  it("does not offer a download for a rejected file", async () => {
    renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "installer.exe" })

    expect(within(rowOf("installer.exe")).queryByRole("button", { name: "Download" })).not.toBeInTheDocument()
  })

  it("warns about what stops working before deleting a file that is in use", async () => {
    let deleted = ""
    server.use(
      http.delete(apiUrl("/v1/files/:id"), ({ params }) => {
        deleted = String(params.id)
        return HttpResponse.json({ used_by: filePdf.used_by })
      }),
    )
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "kinematics-notes.pdf" })

    await pickMoreAction(user, "kinematics-notes.pdf", "Delete")
    const dialog = await screen.findByRole("alertdialog")

    expect(within(dialog).getByText("This file is used. These items will stop working:")).toBeInTheDocument()
    expect(within(dialog).getByText("Chat: Kinematics revision")).toBeInTheDocument()
    expect(await within(dialog).findByText("Lesson: Physics, 7 October")).toBeInTheDocument()
    expect(deleted).toBe("")

    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleted).toBe(ids.file))
  })

  it("deletes a file that is not in use without a warning", async () => {
    const { user } = renderTools(<FilesPage />, { route: "/files/" })
    await screen.findByRole("heading", { name: "installer.exe" })

    await pickMoreAction(user, "installer.exe", "Delete")
    const dialog = await screen.findByRole("alertdialog")

    expect(within(dialog).queryByText(/will stop working/)).not.toBeInTheDocument()
  })
})

describe("file size helpers", () => {
  it("formats sizes with binary units", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(640 * 1024 * 1024)).toBe("640 MB")
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe("1.5 GB")
    expect(formatBytes(482_113)).toBe("471 KB")
  })

  it("computes the quota share and the inline types", () => {
    expect(quotaPercent(640, 1536)).toBe(42)
    expect(quotaPercent(10, 0)).toBe(0)
    expect(opensInline("application/pdf")).toBe(true)
    expect(opensInline("image/png")).toBe(true)
    expect(opensInline("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(false)
  })
})
