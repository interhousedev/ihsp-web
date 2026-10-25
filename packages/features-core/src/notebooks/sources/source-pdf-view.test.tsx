import { describe, expect, it, mock } from "bun:test"
import { nbIds, sourceFile } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import type { PdfEngine, PdfEngineLoader } from "../../library/reader/lib/pdf-types"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SourcePdfView } from "./source-pdf-view"

allowSlowRenders()

const url = "http://localhost:9000/files/f-pdf?disposition=inline&signature=test"

function fakeEngine(
  pageCount: number,
  fail = false,
): { loader: PdfEngineLoader; renderCanvas: ReturnType<typeof mock> } {
  const renderCanvas = mock(() => ({ promise: Promise.resolve(), cancel: () => undefined }))
  const engine: PdfEngine = {
    open: async () => {
      if (fail) throw new Error("broken")
      return {
        pageCount,
        getPage: async (number) => ({
          number,
          width: 600,
          height: 800,
          renderCanvas,
          renderTextLayer: () => ({ promise: Promise.resolve(), cancel: () => undefined }),
          getText: async () => "",
          release: () => undefined,
        }),
        getOutline: async () => [],
        destroy: async () => undefined,
      }
    },
  }
  return { loader: async () => engine, renderCanvas }
}

function renderView(props: { inline: boolean; engine?: PdfEngineLoader; size?: "compact" | "full" }) {
  return renderNotebook(
    <SourcePdfView
      notebookId={nbIds.notebook}
      sourceId={sourceFile.id}
      name="lab-report.pdf"
      url={url}
      size={props.size ?? "compact"}
      inline={props.inline}
      engine={props.engine}
    />,
  )
}

describe("SourcePdfView", () => {
  it("frames the presigned URL fit to width, with no token outside the signed query", () => {
    const { container } = renderView({ inline: true, size: "full" })
    const frame = container.querySelector("iframe")
    expect(frame?.getAttribute("src")).toBe(`${url}#view=FitH`)
    expect(frame?.getAttribute("title")).toBe("lab-report.pdf")
    expect(frame?.getAttribute("src")).not.toContain("token")
    expect(frame?.className).toContain("size-full")
  })

  it("draws the first page where the browser has no PDF viewer", async () => {
    const { loader, renderCanvas } = fakeEngine(12)
    renderView({ inline: false, engine: loader })

    expect(await screen.findByText("Page 1 of 12")).toBeTruthy()
    expect(renderCanvas).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("img", { name: "lab-report.pdf" }).tagName).toBe("CANVAS")
    const link = screen.getByRole("link", { name: "Open the PDF in a new tab" })
    expect(link.getAttribute("href")).toBe(url)
    expect(document.querySelector("iframe")).toBeNull()
  })

  it("keeps the fallback text only when the page cannot be drawn either", async () => {
    const { loader } = fakeEngine(1, true)
    renderView({ inline: false, engine: loader })

    await waitFor(() => expect(screen.getByText(/cannot show PDFs here/)).toBeTruthy())
    expect(screen.getByRole("link", { name: "Open the PDF in a new tab" })).toBeTruthy()
  })
})
