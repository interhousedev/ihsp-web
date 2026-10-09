import { describe, expect, it, mock } from "bun:test"
import type { ArtifactDetail, InfographicBlock, InfographicOptions } from "@ihsp/api"
import { artifactDetailOf, artifactInfographic, infographicContent, nbIds } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { InfographicViewer } from "./infographic-viewer"

allowSlowRenders()

type InfographicDetail = Extract<ArtifactDetail, { kind: "infographic" }>

const timeline: InfographicBlock = {
  type: "timeline",
  title: "History",
  items: [
    { head: "1771", body: "Priestley shows plants renew air" },
    { head: "1779", body: "Ingenhousz finds light is needed" },
  ],
  refs: ["S1:P1"],
}
const quote: InfographicBlock = {
  type: "quote",
  title: "",
  items: [{ head: "Light is the engine of life", body: "Lesson 5" }],
  refs: ["S1:P1", "S1:P3"],
}

function infographicDetail(options: InfographicOptions = {}, blocks = infographicContent.blocks): InfographicDetail {
  const detail = artifactDetailOf({ ...artifactInfographic, options: { ...artifactInfographic.options, ...options } })
  if (detail.kind !== "infographic") throw new Error("expected an infographic artifact")
  return { ...detail, content: { ...infographicContent, blocks } }
}

function renderViewer(options: InfographicOptions = {}, blocks = [...infographicContent.blocks, timeline, quote]) {
  return renderNotebook(<InfographicViewer notebookId={nbIds.notebook} artifact={infographicDetail(options, blocks)} />)
}

const scaler = () => within(screen.getByTestId("infographic-scaler"))
const canvas = () => scaler().getByTestId("infographic-canvas")

describe("InfographicViewer", () => {
  it("renders nothing while the infographic has no content", () => {
    const detail = { ...infographicDetail(), content: null }
    const { container } = renderNotebook(<InfographicViewer notebookId={nbIds.notebook} artifact={detail} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("shows the title, the subtitle and the footer", () => {
    renderViewer()

    expect(scaler().getByRole("heading", { level: 2, name: "Photosynthesis at a glance" })).toBeInTheDocument()
    expect(scaler().getByText("Grade 10")).toBeInTheDocument()
    expect(scaler().getByText("Source: Biology 10.pdf")).toBeInTheDocument()
  })

  it("renders every block type in its order", () => {
    renderViewer()

    const blocks = Array.from(canvas().querySelectorAll("[data-block]")).map((block) =>
      block.getAttribute("data-block"),
    )
    expect(blocks).toEqual(["stat", "steps", "comparison", "list", "definition", "callout", "timeline", "quote"])
  })

  it("draws a stat as a big value with its caption", () => {
    renderViewer()

    expect(scaler().getByText("6CO2 + 6H2O")).toBeInTheDocument()
    expect(scaler().getByText("-> C6H12O6 + 6O2")).toBeInTheDocument()
  })

  it("draws steps as a numbered process", () => {
    renderViewer()

    const steps = within(scaler().getByRole("heading", { name: "Process" }).closest("section") as HTMLElement)
    const items = steps.getAllByRole("listitem")
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent("Step 1")
    expect(items[0]).toHaveTextContent("Absorb light")
    expect(items[2]).toHaveTextContent("RuBisCO in the stroma")
  })

  it("draws a comparison with a column per entry", () => {
    renderViewer()

    expect(scaler().getByRole("heading", { level: 4, name: "Light" })).toBeInTheDocument()
    expect(scaler().getByRole("heading", { level: 4, name: "Calvin" })).toBeInTheDocument()
    expect(scaler().getByText("Needs ATP")).toBeInTheDocument()
  })

  it("draws a list, a definition, a timeline, a quote and a callout", () => {
    renderViewer()

    const list = within(scaler().getByRole("heading", { name: "Limiting factors" }).closest("section") as HTMLElement)
    expect(list.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Light", "CO2", "Temperature"])
    expect(scaler().getByRole("term")).toHaveTextContent("Stroma")
    expect(scaler().getByRole("definition")).toHaveTextContent("The fluid inside the chloroplast")
    expect(scaler().getByText("1771")).toBeInTheDocument()
    expect(scaler().getByText("Ingenhousz finds light is needed")).toBeInTheDocument()
    expect(scaler().getByText("Light is the engine of life").tagName).toBe("BLOCKQUOTE")
    const callout = within(scaler().getByRole("heading", { name: "Remember" }).closest("section") as HTMLElement)
    expect(callout.getByText("Light reactions: thylakoid")).toBeInTheDocument()
  })

  it("names a callout without a title 'Key takeaway'", () => {
    const callout: InfographicBlock = { ...infographicContent.blocks[5]!, title: "" }
    renderViewer({}, [callout])

    expect(scaler().getByRole("heading", { name: "Key takeaway" })).toBeInTheDocument()
  })
})

describe("InfographicViewer: canvas", () => {
  it.each([
    ["portrait", "800px", "1200px"],
    ["landscape", "1200px", "800px"],
    ["square", "1000px", "1000px"],
  ] as const)("has the fixed %s size", (orientation, width, height) => {
    renderViewer({ orientation })

    expect(canvas()).toHaveAttribute("data-orientation", orientation)
    expect(canvas().style.width).toBe(width)
    expect(canvas().style.height).toBe(height)
  })

  it("is portrait when the options do not say", () => {
    const detail = infographicDetail()
    renderNotebook(<InfographicViewer notebookId={nbIds.notebook} artifact={{ ...detail, options: {} }} />)

    expect(canvas()).toHaveAttribute("data-orientation", "portrait")
    expect(canvas()).toHaveAttribute("data-style", "clean")
  })

  it.each(["clean", "sketch", "bento", "scientific", "playful"] as const)("applies the %s theme", (style) => {
    renderViewer({ style })

    expect(canvas()).toHaveAttribute("data-style", style)
    expect(canvas().style.getPropertyValue("--ig-accent")).not.toBe("")
  })

  it("gives the themes their own colours", () => {
    const { unmount } = renderViewer({ style: "clean" })
    const clean = canvas().style.getPropertyValue("--ig-bg")
    unmount()
    renderViewer({ style: "playful" })

    expect(canvas().style.getPropertyValue("--ig-bg")).not.toBe(clean)
  })

  it("keeps the label of the canvas region", () => {
    renderViewer()

    expect(screen.getByRole("region", { name: "Infographic" })).toBeInTheDocument()
  })
})

describe("InfographicViewer: zoom", () => {
  it("starts at 100 % when the container has no width yet and zooms with the buttons", async () => {
    const { user } = renderViewer()
    expect(screen.getByTestId("zoom-value")).toHaveTextContent("100%")

    await user.click(screen.getByRole("button", { name: "Zoom in" }))
    expect(screen.getByTestId("zoom-value")).toHaveTextContent("110%")
    expect(screen.getByTestId("infographic-scaler")).toHaveAttribute("data-scale", "1.1")
    expect(screen.getByTestId("infographic-scaler").style.width).toBe("880px")
    expect(canvas().parentElement?.style.transform).toBe("scale(1.1)")

    await user.click(screen.getByRole("button", { name: "Zoom out" }))
    await user.click(screen.getByRole("button", { name: "Zoom out" }))
    expect(screen.getByTestId("zoom-value")).toHaveTextContent("90%")
    expect(canvas().parentElement?.style.transform).toBe("scale(0.9)")
  })

  it("fits the canvas to the width of its container", async () => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth")
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 400 })
    try {
      const { user } = renderViewer()
      await waitFor(() => expect(screen.getByTestId("zoom-value")).toHaveTextContent("50%"))
      const fit = screen.getByRole("button", { name: "Fit to width" })
      expect(fit).toHaveAttribute("aria-pressed", "true")

      await user.click(screen.getByRole("button", { name: "Zoom in" }))
      expect(screen.getByTestId("zoom-value")).toHaveTextContent("60%")
      expect(fit).toHaveAttribute("aria-pressed", "false")

      await user.click(fit)
      expect(screen.getByTestId("zoom-value")).toHaveTextContent("50%")
      expect(screen.getByTestId("infographic-scaler").style.height).toBe("600px")
    } finally {
      if (original) Object.defineProperty(HTMLElement.prototype, "clientWidth", original)
      else Reflect.deleteProperty(HTMLElement.prototype, "clientWidth")
    }
  })

  it("stops at the smallest and the largest zoom", async () => {
    const { user } = renderViewer()

    for (let step = 0; step < 9; step += 1) await user.click(screen.getByRole("button", { name: "Zoom out" }))
    expect(screen.getByTestId("zoom-value")).toHaveTextContent("20%")
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled()
  })
})

describe("InfographicViewer: sources", () => {
  it("collapses the chips of all blocks into one row, each passage once", async () => {
    const { user } = renderViewer()
    const trigger = screen.getByRole("button", { name: "Sources (5)" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("button", { name: /^Source 1/ })).not.toBeInTheDocument()

    await user.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(await screen.findAllByRole("button", { name: /^Source \d/ })).toHaveLength(5)
    expect(screen.getByRole("button", { name: /Source 1: Biology 10\.pdf/ })).toBeInTheDocument()
  })

  it("has no sources row when no block cites anything", () => {
    renderViewer({}, [{ ...infographicContent.blocks[5]!, refs: [] }])

    expect(screen.queryByRole("button", { name: /^Sources/ })).not.toBeInTheDocument()
  })
})

describe("InfographicViewer: download, print and copy", () => {
  it("falls back to the print dialog with an inline error when the PNG cannot be made", async () => {
    const print = mock(() => undefined)
    window.print = print
    const { user } = renderViewer()

    await user.click(screen.getByRole("button", { name: "Download PNG" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not create the image. Use Print / PDF instead.")
    expect(print).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled()
  })

  it("always has a Print / PDF button", async () => {
    const print = mock(() => undefined)
    window.print = print
    const { user } = renderViewer()

    await user.click(screen.getByRole("button", { name: "Print / PDF" }))

    expect(print).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("keeps a hidden full-size copy for paper, on a page of the canvas size", () => {
    renderViewer({ orientation: "landscape" })

    const sheet = document.body.querySelector("[data-ig-print]")
    expect(sheet).not.toBeNull()
    expect(sheet).toHaveAttribute("aria-hidden", "true")
    expect(sheet).toHaveClass("hidden", "print:block")
    expect(sheet?.querySelector("style")?.textContent).toContain("size: 1200px 800px")
    expect(sheet?.querySelector("[data-testid=infographic-canvas]")).not.toBeNull()
  })

  it("copies the text of the infographic", async () => {
    const { user } = renderViewer()

    await user.click(screen.getByRole("button", { name: "Copy text" }))

    await waitFor(async () => expect(await navigator.clipboard.readText()).toContain("Photosynthesis at a glance"))
    expect(await navigator.clipboard.readText()).toContain("1. Absorb light: Chlorophyll captures it")
  })
})
