/** The public page of a shared bot answer behind `/ai/m-<id>`. */
import { describe, expect, spyOn, test } from "bun:test"
import { Toaster } from "@ihsp/ui"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ShareViewer } from "../features/share/share-viewer"
import { isVisualizationSlug, sharePage } from "../features/share/visualization-view"
import { allowSlowTests, renderShare, shareRoute } from "./helpers"

allowSlowTests()

const TEXT = 'Intro words\n\n```openui\nroot = Stack([StatGrid([{label: "Average", value: 4.5}])])\n```\n\nOutro words'

function serve(slug: string, status = 200) {
  server.use(
    http.get(apiUrl(`/v1/public/visualizations/${slug}`), () =>
      status === 200
        ? HttpResponse.json({ text: TEXT, created_at: "2026-10-26T08:00:00Z", expires_at: "2026-11-26T08:00:00Z" })
        : HttpResponse.json(
            { title: "x", status },
            { status, headers: { "Content-Type": "application/problem+json" } },
          ),
    ),
  )
}

describe("visualization page", () => {
  test("recognizes m- slugs", () => {
    expect(isVisualizationSlug("m-3f2c")).toBe(true)
    expect(isVisualizationSlug("c-3f2c")).toBe(false)
  })

  test("renders the text and the OpenUI block, forces light, shows no user name", async () => {
    document.documentElement.classList.add("dark")
    serve("m-abc")
    renderShare(<ShareViewer />, { route: shareRoute("m-abc") })
    expect(await screen.findByText("Average", {}, { timeout: 8000 })).toBeInTheDocument()
    expect(screen.getByText("4.5")).toBeInTheDocument()
    expect(screen.getByText(/Intro words/)).toBeInTheDocument()
    expect(screen.getByText(/Outro words/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument()
    expect(screen.queryByText(/Shared by/)).toBeNull()
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  test("Share copies the address and shows the toast when navigator.share is missing", async () => {
    serve("m-abc")
    const written: string[] = []
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined })
    const spy = spyOn(navigator.clipboard, "writeText").mockImplementation(async (v: string) => void written.push(v))
    renderShare(
      <>
        <ShareViewer />
        <Toaster />
      </>,
      { route: shareRoute("m-abc") },
    )
    fireEvent.click(await screen.findByRole("button", { name: "Share" }))
    await waitFor(() => expect(written).toEqual([window.location.href]))
    expect(await screen.findByText("Link copied")).toBeInTheDocument()
    spy.mockRestore()
  })

  test("sharePage uses navigator.share when present", async () => {
    const calls: unknown[] = []
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (d: unknown) => void calls.push(d),
    })
    await sharePage("T", { copied: "c", failed: "f" })
    expect(calls).toEqual([{ url: window.location.href, title: "T" }])
  })

  test("410 shows the expired state", async () => {
    serve("m-old", 410)
    renderShare(<ShareViewer />, { route: shareRoute("m-old") })
    expect(await screen.findByText("This link has expired")).toBeInTheDocument()
  })

  test("404 shows not found", async () => {
    serve("m-none", 404)
    renderShare(<ShareViewer />, { route: shareRoute("m-none") })
    expect(await screen.findByText("Link not found")).toBeInTheDocument()
  })
})
