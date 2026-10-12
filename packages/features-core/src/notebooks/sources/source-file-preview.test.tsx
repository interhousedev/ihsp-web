import { beforeEach, describe, expect, it, mock } from "bun:test"
import type { SourceDetail, SourceFile } from "@ihsp/api"
import { apiUrl, nbIds, server, sourceDetailOf, sourceFile } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { previewKindOf } from "./source-file-preview"
import { SourceViewer } from "./source-viewer"

allowSlowRenders()

beforeEach(() => {
  Element.prototype.scrollIntoView = mock(() => undefined)
})

const image: SourceFile = { id: "f-image", name: "lab-setup.jpg", content_type: "image/jpeg", byte_size: 2_904_881 }
const video: SourceFile = { id: "f-video", name: "experiment.mp4", content_type: "video/mp4", byte_size: 90_000_000 }
const sheet: SourceFile = {
  id: "f-sheet",
  name: "results.xlsx",
  content_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  byte_size: 20_480,
}

/** The viewer of `sourceFile` with the given upload behind it (the file-url handler answers for it). */
function renderWithFile(file: SourceFile) {
  const detail: SourceDetail = { ...sourceDetailOf(sourceFile), title: file.name, file }
  server.use(
    http.get(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/${sourceFile.id}`), () => HttpResponse.json(detail)),
    http.get(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/${sourceFile.id}/file-url`), ({ request }) => {
      const disposition = new URL(request.url).searchParams.get("disposition") ?? "attachment"
      return HttpResponse.json({
        url: `http://localhost:9000/files/${file.id}?disposition=${disposition}&signature=test`,
        expires_at: "2026-10-07T05:13:00Z",
      })
    }),
  )
  return renderNotebook(<SourceViewer notebookId={nbIds.notebook} sourceId={sourceFile.id} />)
}

function preview() {
  return screen.getByRole("region", { name: "File preview" })
}

describe("previewKindOf", () => {
  it("maps content types to what the window shows", () => {
    expect(previewKindOf(image)).toBe("image")
    expect(previewKindOf(video)).toBe("video")
    expect(previewKindOf({ ...sheet, content_type: "application/pdf" })).toBe("pdf")
    expect(previewKindOf({ ...sheet, content_type: "audio/mpeg" })).toBe("audio")
    expect(previewKindOf(sheet)).toBe("card")
  })
})

describe("SourceFilePreview", () => {
  it("shows an image source as a zoomable picture with Open full preview and Download", async () => {
    const { user } = renderWithFile(image)

    const region = await waitFor(() => preview())
    const picture = await within(region).findByRole("img", { name: "lab-setup.jpg" })
    expect(picture.getAttribute("src")).toContain(`/files/${image.id}?disposition=inline`)
    expect(within(region).getByRole("button", { name: "Open full preview" })).toBeTruthy()
    const download = within(region).getByRole("link", { name: "Download" })
    await waitFor(() => {
      expect(download.getAttribute("href")).toBe(
        `http://localhost:9000/files/${image.id}?disposition=attachment&signature=test`,
      )
    })
    expect(download.getAttribute("download")).toBe("lab-setup.jpg")

    await user.click(within(region).getByRole("button", { name: "Open lab-setup.jpg at full size" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("img", { name: "lab-setup.jpg" })).toBeTruthy()
  })

  it("shows a video source as a native player", async () => {
    renderWithFile(video)

    const region = await waitFor(() => preview())
    await waitFor(() => {
      const player = region.querySelector("video")
      expect(player).not.toBeNull()
      expect(player?.getAttribute("src")).toContain(`/files/${video.id}`)
      expect(player?.hasAttribute("controls")).toBe(true)
      expect(player?.getAttribute("preload")).toBe("metadata")
    })
    expect(within(region).getByRole("button", { name: "Open full preview" })).toBeTruthy()
  })

  it("shows a spreadsheet as a file card with name, size and type, and only Download", async () => {
    renderWithFile(sheet)

    const region = await waitFor(() => preview())
    expect(within(region).getByText("results.xlsx")).toBeTruthy()
    expect(within(region).getByText("20 kB")).toBeTruthy()
    expect(within(region).getByText(sheet.content_type)).toBeTruthy()
    expect(within(region).queryByRole("button", { name: "Open full preview" })).toBeNull()
    expect(within(region).getByRole("link", { name: "Download" })).toBeTruthy()
  })

  it("shows no preview for a pasted text", async () => {
    renderNotebook(<SourceViewer notebookId={nbIds.notebook} sourceId={nbIds.sourceText} />)

    await screen.findByRole("heading", { level: 2, name: /./ })
    await waitFor(() => expect(screen.queryByText("Loading…")).toBeNull())
    expect(screen.queryByRole("region", { name: "File preview" })).toBeNull()
  })
})
