/** One file element everywhere: the same row, the same opening, the same failure and the same share menu. */
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { apiUrl, server } from "@ihsp/test-utils"
import { fileKindOf } from "../file-upload-button/drive-picker/file-kind"
import { renderNotebook as renderTools } from "../notebooks/test-support"
import { FileDownloadButton, FileOpenLink } from "./file-actions"
import { FileItem } from "./file-item"
import { FileShareMenu } from "./file-share-menu"

const FILE_ID = "018f0000-0000-7000-8000-000000000001"
const realOpen = window.open
let opened: ReturnType<typeof mock>

beforeEach(() => {
  opened = mock(() => null)
  window.open = opened as unknown as typeof window.open
})
afterEach(() => {
  window.open = realOpen
})

describe("FileItem", () => {
  it("shows the name, type icon and details the same way for any source", () => {
    const { container } = render(
      <FileItem name="notes.pdf" contentType="application/pdf" meta={["2 MB", null, "Today"]} />,
    )
    expect(screen.getByText("notes.pdf")).toBeInTheDocument()
    expect(screen.getByText("2 MB · Today")).toBeInTheDocument()
    expect(container.querySelector("svg.tabler-icon-file-type-pdf")).not.toBeNull()
  })

  it("knows archives, audio and old Office formats", () => {
    expect(fileKindOf({ content_type: "application/zip" })).toBe("archive")
    expect(fileKindOf({ content_type: "audio/mpeg" })).toBe("audio")
    expect(fileKindOf({ content_type: "application/msword" })).toBe("doc")
    expect(fileKindOf({ content_type: "application/vnd.ms-powerpoint" })).toBe("slides")
  })
})

describe("FileDownloadButton", () => {
  it("opens the resolved address in a new tab without an opener", async () => {
    renderTools(<FileDownloadButton resolve={async () => "https://s3.test/a"} />)
    await userEvent.click(screen.getByRole("button", { name: "Download" }))
    await waitFor(() => expect(opened).toHaveBeenCalledWith("https://s3.test/a", "_blank", "noopener,noreferrer"))
  })

  it("reports the same failure and opens nothing when the address cannot be resolved", async () => {
    const onError = mock(() => undefined)
    renderTools(<FileDownloadButton resolve={() => Promise.reject(new Error("x"))} onError={onError} />)
    await userEvent.click(screen.getByRole("button", { name: "Download" }))
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(opened).not.toHaveBeenCalled()
  })
})

describe("FileOpenLink", () => {
  it("is a safe external link outside Telegram", () => {
    renderTools(<FileOpenLink href="https://x.test/s/abc" title="Notes" />)
    const link = screen.getByRole("link", { name: "Open Notes" })
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })
})

describe("FileShareMenu", () => {
  it("states which link is public and which requires sign-in", async () => {
    renderTools(<FileShareMenu fileId={FILE_ID} name="notes.pdf" onPeople={() => undefined} />)
    await userEvent.click(screen.getByRole("button", { name: "Share notes.pdf" }))
    expect(await screen.findByRole("menuitem", { name: /Public link.*no sign-in/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Sign-in link or people.*signed-in/ })).toBeInTheDocument()
  })

  it("the public link is the same short link request as before", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/links"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: "1", url: "https://x.test/s/abc" }, { status: 201 })
      }),
    )
    renderTools(<FileShareMenu fileId={FILE_ID} name="notes.pdf" />)
    await userEvent.click(screen.getByRole("button", { name: "Share notes.pdf" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: /Public link/ }))
    await waitFor(() => expect(body).toEqual({ kind: "file", file_id: FILE_ID }))
  })

  it("the people entry only opens the panel and is absent where it is not offered", async () => {
    const onPeople = mock(() => undefined)
    const { unmount } = renderTools(<FileShareMenu fileId={FILE_ID} name="a" onPeople={onPeople} />)
    await userEvent.click(screen.getByRole("button", { name: "Share a" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: /Sign-in link/ }))
    expect(onPeople).toHaveBeenCalledTimes(1)
    unmount()
    renderTools(<FileShareMenu fileId={FILE_ID} name="b" />)
    await userEvent.click(screen.getByRole("button", { name: "Share b" }))
    await screen.findByRole("menuitem", { name: /Public link/ })
    expect(screen.queryByRole("menuitem", { name: /Sign-in link/ })).toBeNull()
  })
})
