import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import type { ArtifactDetail } from "@ihsp/api"
import { apiUrl, artifactDetailOf, artifactReport, nbIds, reportContent, server } from "@ihsp/test-utils"
import { act, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { markersToBrackets } from "../lib/citations"
import { ReportViewer } from "./report-viewer"

allowSlowRenders()

afterEach(() => {
  window.innerWidth = 1280
})

function reportArtifact(): Extract<ArtifactDetail, { kind: "report" }> {
  const detail = artifactDetailOf(artifactReport)
  if (detail.kind !== "report") throw new Error("fixture is not a report")
  return detail
}

function renderReport() {
  return renderNotebook(<ReportViewer notebookId={nbIds.notebook} artifact={reportArtifact()} />)
}

describe("ReportViewer", () => {
  it("renders the Markdown with a citation chip for every marker", () => {
    renderReport()

    expect(screen.getByRole("heading", { name: "Main idea" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /^Source \d: / })).toHaveLength(6)
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.queryByText(/⟦/)).not.toBeInTheDocument()
  })

  it("lists the headings in Contents and jumps to the clicked one", async () => {
    const scrollIntoView = mock(() => undefined)
    Element.prototype.scrollIntoView = scrollIntoView
    const { user } = renderReport()

    const contents = screen.getByRole("navigation", { name: "Contents" })
    const links = within(contents).getAllByRole("link")
    expect(links).toHaveLength(reportContent.headings.length)
    await user.click(within(contents).getByRole("link", { name: "3. Calvin cycle" }))

    const target = screen.getByRole("heading", { name: "3. Calvin cycle" })
    expect(target.id).not.toBe("")
    expect(links.find((link) => link.textContent === "3. Calvin cycle")).toHaveAttribute("href", `#${target.id}`)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(target).toHaveFocus()
  })

  it("matches headings that contain citation chips or repeat", () => {
    renderNotebook(
      <ReportViewer
        notebookId={nbIds.notebook}
        artifact={{
          ...reportArtifact(),
          content: {
            ...reportContent,
            markdown: "# Title ⟦1⟧\n\n## Same\ntext\n\n## Same\nmore",
            headings: [
              { level: 1, text: "Title", id: "title" },
              { level: 2, text: "Same", id: "same" },
              { level: 2, text: "Same", id: "same-2" },
            ],
          },
        }}
      />,
    )

    const headings = screen.getAllByRole("heading").filter((heading) => heading.id !== "")
    expect(headings).toHaveLength(3)
    expect(new Set(headings.map((heading) => heading.id)).size).toBe(3)
  })

  it("folds Contents into a collapsible list on a phone", async () => {
    window.innerWidth = 360
    const { user } = renderReport()

    const trigger = screen.getByRole("button", { name: "Contents" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await user.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(await screen.findByRole("link", { name: "Key terms" })).toBeInTheDocument()
  })

  it("copies the text with [n] instead of the markers", async () => {
    const { user } = renderReport()

    await user.click(screen.getByRole("button", { name: "Copy" }))

    const copied = await navigator.clipboard.readText()
    expect(copied).toBe(markersToBrackets(reportContent.markdown))
    expect(copied).toContain("glucose [1].")
    expect(copied).toContain("[4][5]")
    expect(copied).not.toContain("⟦")
  })

  it("downloads a .md file", async () => {
    const created: Blob[] = []
    const createObjectURL = spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      created.push(blob as Blob)
      return "blob:report"
    })
    spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)
    const { user } = renderReport()

    await user.click(screen.getByRole("button", { name: "Download .md" }))

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(created[0]?.type).toContain("text/markdown")
    expect(await created[0]?.text()).toBe(markersToBrackets(reportContent.markdown))
  })

  it("prints through the browser", async () => {
    const print = mock(() => undefined)
    window.print = print
    const { user } = renderReport()

    await user.click(screen.getByRole("button", { name: "Print / PDF" }))

    expect(print).toHaveBeenCalledTimes(1)
  })

  it("hides the chrome when printing", () => {
    renderReport()

    expect(screen.getByRole("group", { name: "Report actions" }).parentElement).toHaveClass("print:hidden")
    expect(screen.getByRole("navigation", { name: "Contents" }).parentElement).toHaveClass("print:hidden")
  })

  it("adds the report as a source once and then disables the button", async () => {
    let calls = 0
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/${artifactReport.id}/save-as-source`), () => {
        calls += 1
        return HttpResponse.json({ id: "s-new" }, { status: 201 })
      }),
    )
    const { user } = renderReport()

    await user.click(screen.getByRole("button", { name: "Add as source" }))

    await waitFor(() => expect(screen.getByRole("button", { name: "Add as source" })).toBeDisabled())
    expect(calls).toBe(1)
  })

  it("shows the error when adding fails and keeps the button enabled", async () => {
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/${artifactReport.id}/save-as-source`), () =>
        HttpResponse.json(
          { type: "notebooks/source-limit", title: "Limit", status: 409 },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderReport()

    await user.click(screen.getByRole("button", { name: "Add as source" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/limit of sources/)
    expect(screen.getByRole("button", { name: "Add as source" })).toBeEnabled()
  })

  it("asks the chat about the selected text with a text anchor", async () => {
    const { user, actions } = renderReport()
    expect(screen.queryByRole("button", { name: "Ask about this" })).not.toBeInTheDocument()

    const line = screen.getByText(/Light reactions: thylakoid/)
    act(() => {
      const range = document.createRange()
      range.selectNodeContents(line)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      document.dispatchEvent(new Event("selectionchange"))
    })
    await user.click(await screen.findByRole("button", { name: "Ask about this" }))

    expect(actions.ask).toHaveBeenCalledTimes(1)
    expect(actions.ask).toHaveBeenCalledWith({
      text: "Explain this part of the report in more detail.",
      anchor: { kind: "text", text: expect.stringContaining("Light reactions: thylakoid") },
    })
  })
})
