import { afterEach, describe, expect, it, spyOn } from "bun:test"
import type { ArtifactDetail, MindMapContent, MindMapNode } from "@ihsp/api"
import { isMiniApp } from "@ihsp/telegram"
import { artifactDetailOf, artifactMindMap, mindMapContent, nbIds, passageId } from "@ihsp/test-utils"
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import * as download from "../../lib/download"
import { allowSlowRenders, renderNotebook } from "../../test-support"
import { MindMapViewer } from "./mind-map-viewer"

allowSlowRenders()

type MindMapArtifact = Extract<ArtifactDetail, { kind: "mind_map" }>

function mindMapArtifact(content?: MindMapContent): MindMapArtifact {
  const detail = artifactDetailOf(artifactMindMap)
  if (detail.kind !== "mind_map") throw new Error("the fixture is not a mind map")
  return content ? { ...detail, content } : detail
}

function renderViewer(artifact: MindMapArtifact = mindMapArtifact()) {
  return renderNotebook(<MindMapViewer notebookId={nbIds.notebook} artifact={artifact} />)
}

/** An image that "loads" as soon as it gets a source (happy-dom does not load images). */
class FakeImage {
  private listeners = new Map<string, () => void>()
  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, listener)
  }
  set src(_value: string) {
    queueMicrotask(() => this.listeners.get("load")?.())
  }
}

const node = (name: string) => screen.getByRole("treeitem", { name })
const focusNode = (name: string) => {
  act(() => {
    node(name).focus()
  })
}
const maybeNode = (name: string) => screen.queryByRole("treeitem", { name })
const toggleOf = (name: string) => {
  const control = node(name).querySelector('[data-slot="mind-map-toggle"]')
  if (!control) throw new Error(`${name} has no expand control`)
  return control
}
const viewport = () => document.querySelector<SVGGElement>('[data-slot="mind-map-viewport"]')
const transformOf = () => viewport()?.style.transform ?? ""
const scaleOf = () => Number(/scale\(([\d.]+)\)/.exec(transformOf())?.[1])
const buttons = (name: RegExp | string) => screen.getByRole("button", { name })

afterEach(() => {
  window.location.hash = ""
})

describe("MindMapViewer: tree", () => {
  it("shows the root and the first level as tree items with their levels", () => {
    renderViewer()

    expect(screen.getByRole("tree", { name: /Photosynthesis/ })).toBeInTheDocument()
    expect(screen.getAllByRole("treeitem")).toHaveLength(5)
    expect(node("Photosynthesis")).toHaveAttribute("aria-level", "1")
    expect(node("Chloroplast")).toHaveAttribute("aria-level", "2")
    expect(node("Chloroplast")).toHaveAttribute("aria-setsize", "4")
    expect(node("Light reactions")).toHaveAttribute("aria-posinset", "2")
    expect(maybeNode("Thylakoids")).not.toBeInTheDocument()
  })

  it("sets aria-expanded on branches only", () => {
    renderViewer()

    expect(node("Photosynthesis")).toHaveAttribute("aria-expanded", "true")
    expect(node("Chloroplast")).toHaveAttribute("aria-expanded", "false")
    expect(node("Limiting factors")).not.toHaveAttribute("aria-expanded")
  })

  it("keeps one tab stop (roving tabindex) on the root", () => {
    renderViewer()

    const stops = screen.getAllByRole("treeitem").filter((item) => item.getAttribute("tabindex") === "0")
    expect(stops).toHaveLength(1)
    expect(stops[0]).toBe(node("Photosynthesis"))
  })

  it("expands and collapses a branch with its control", async () => {
    const { user } = renderViewer()

    await user.click(toggleOf("Chloroplast"))
    expect(node("Chloroplast")).toHaveAttribute("aria-expanded", "true")
    expect(node("Thylakoids")).toBeInTheDocument()
    expect(node("Stroma")).toBeInTheDocument()

    await user.click(toggleOf("Chloroplast"))
    expect(node("Chloroplast")).toHaveAttribute("aria-expanded", "false")
    expect(maybeNode("Thylakoids")).not.toBeInTheDocument()
  })

  it("does not open the details when the control is clicked", async () => {
    const { user } = renderViewer()

    await user.click(toggleOf("Chloroplast"))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("expands a branch with Enter", async () => {
    const { user } = renderViewer()

    focusNode("Light reactions")
    await user.keyboard("{Enter}")

    expect(node("Light reactions")).toHaveAttribute("aria-expanded", "true")
    expect(node("Water is split")).toBeInTheDocument()

    await user.keyboard("{Enter}")
    expect(maybeNode("Water is split")).not.toBeInTheDocument()
  })

  it("expands all and collapses all", async () => {
    const { user } = renderViewer()

    await user.click(buttons("Expand all"))
    expect(screen.getAllByRole("treeitem")).toHaveLength(12)
    expect(node("CO2 fixation")).toBeInTheDocument()

    await user.click(buttons("Collapse all"))
    expect(screen.getAllByRole("treeitem")).toHaveLength(5)
    expect(node("Photosynthesis")).toHaveAttribute("aria-expanded", "true")
    expect(node("Calvin cycle")).toHaveAttribute("aria-expanded", "false")
  })

  it("shows an empty state for a map without nodes", () => {
    renderViewer(mindMapArtifact({ title: "Empty", nodes: [] }))

    expect(screen.getByText("This mind map is empty.")).toBeInTheDocument()
  })
})

describe("MindMapViewer: details", () => {
  it("opens the note of a clicked node", async () => {
    const { user } = renderViewer()

    await user.click(node("Light reactions"))

    const dialog = screen.getByRole("dialog", { name: /Light reactions/ })
    expect(within(dialog).getByText("Take place in the thylakoid membranes.")).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: /Source 1: Biology 10\.pdf/ })).toBeInTheDocument()
  })

  it("asks the chat with the exact prompt and an anchor on the node's passages", async () => {
    const { user, actions } = renderViewer()

    await user.click(node("Light reactions"))
    await user.click(buttons("Ask in chat"))

    expect(actions.ask).toHaveBeenCalledTimes(1)
    expect(actions.ask).toHaveBeenCalledWith({
      text: "Explain “Light reactions” using my sources.",
      anchor: { kind: "passages", ids: [passageId(1, 3)] },
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens the first source at its passage", async () => {
    const { user, actions } = renderViewer()

    await user.click(node("Limiting factors"))
    await user.click(buttons("Show sources"))

    expect(actions.openSource).toHaveBeenCalledWith(nbIds.sourceLesson, passageId(2, 3))
  })

  it("skips unknown labels, and omits the anchor when none is known", async () => {
    const nodes: MindMapNode[] = [
      { id: "r", parent_id: null, label: "Root", note: "", refs: ["S1:P1"] },
      {
        id: "a",
        parent_id: "r",
        label: "Mixed",
        note: "Some",
        refs: ["S9:P9", "S1:P3", "S1:P3"],
      },
      {
        id: "b",
        parent_id: "r",
        label: "Unknown",
        note: "None",
        refs: ["S9:P9"],
      },
    ]
    const { user, actions } = renderViewer(mindMapArtifact({ title: "T", nodes }))

    await user.click(node("Mixed"))
    await user.click(buttons("Ask in chat"))
    expect(actions.ask).toHaveBeenLastCalledWith({
      text: "Explain “Mixed” using my sources.",
      anchor: { kind: "passages", ids: [passageId(1, 3)] },
    })

    await user.click(node("Unknown"))
    expect(buttons("Show sources")).toBeDisabled()
    await user.click(buttons("Ask in chat"))
    expect(actions.ask).toHaveBeenLastCalledWith({
      text: "Explain “Unknown” using my sources.",
    })
  })

  it("toggles the details from the node and closes them with the close button", async () => {
    const { user } = renderViewer()

    await user.click(node("Chloroplast"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Expand",
      }),
    )
    expect(node("Chloroplast")).toHaveAttribute("aria-expanded", "true")
    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Collapse",
      }),
    ).toBeInTheDocument()

    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("closes the details on a second click, and shows only one card at a time", async () => {
    const { user } = renderViewer()

    await user.click(node("Chloroplast"))
    await user.click(node("Calvin cycle"))
    expect(screen.getAllByRole("dialog")).toHaveLength(1)
    expect(screen.getByRole("dialog", { name: /Calvin cycle/ })).toBeInTheDocument()

    await user.click(node("Calvin cycle"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})

describe("MindMapViewer: keyboard", () => {
  it("moves with the arrow keys like a tree", async () => {
    const { user } = renderViewer()
    focusNode("Photosynthesis")

    // Right: the root is open, so go to its first child.
    await user.keyboard("{ArrowRight}")
    expect(node("Chloroplast")).toHaveFocus()
    expect(node("Chloroplast")).toHaveAttribute("tabindex", "0")
    expect(node("Photosynthesis")).toHaveAttribute("tabindex", "-1")

    await user.keyboard("{ArrowDown}")
    expect(node("Light reactions")).toHaveFocus()
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(node("Limiting factors")).toHaveFocus()
    // The last one of the column stays.
    await user.keyboard("{ArrowDown}")
    expect(node("Limiting factors")).toHaveFocus()
    await user.keyboard("{ArrowUp}")
    expect(node("Calvin cycle")).toHaveFocus()

    // Left on a collapsed branch goes to the parent.
    await user.keyboard("{ArrowLeft}")
    expect(node("Photosynthesis")).toHaveFocus()
  })

  it("expands with Right, enters the branch, and collapses with Left", async () => {
    const { user } = renderViewer()
    focusNode("Chloroplast")

    await user.keyboard("{ArrowRight}")
    expect(node("Chloroplast")).toHaveAttribute("aria-expanded", "true")
    expect(node("Chloroplast")).toHaveFocus()

    await user.keyboard("{ArrowRight}")
    expect(node("Thylakoids")).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(node("Chloroplast")).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(node("Chloroplast")).toHaveAttribute("aria-expanded", "false")
    expect(maybeNode("Thylakoids")).not.toBeInTheDocument()
  })

  it("jumps with Home and End", async () => {
    const { user } = renderViewer()
    focusNode("Light reactions")

    await user.keyboard("{End}")
    expect(node("Limiting factors")).toHaveFocus()
    await user.keyboard("{Home}")
    expect(node("Photosynthesis")).toHaveFocus()
  })

  it("opens the details with Space and closes them with Escape, returning focus to the node", async () => {
    const { user } = renderViewer()
    focusNode("Calvin cycle")

    await user.keyboard(" ")
    const dialog = await screen.findByRole("dialog", { name: /Calvin cycle/ })
    expect(dialog).toHaveFocus()
    expect(within(dialog).getByText("Builds sugar in the stroma.")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await waitFor(() => expect(node("Calvin cycle")).toHaveFocus())
  })

  it("opens the details of a leaf with Enter", async () => {
    const { user } = renderViewer()
    focusNode("Limiting factors")

    await user.keyboard("{Enter}")

    expect(screen.getByRole("dialog", { name: /Limiting factors/ })).toBeInTheDocument()
  })

  it("reaches the actions of a node with the keyboard alone", async () => {
    const { user, actions } = renderViewer()
    focusNode("Light reactions")

    await user.keyboard(" ")
    await user.tab()
    await user.tab()
    await user.tab()
    await user.keyboard("{Enter}")

    await waitFor(() => expect(actions.ask).toHaveBeenCalledTimes(1))
  })

  it("hands the tab stop back to the root when the focused branch disappears", async () => {
    const { user } = renderViewer()
    await user.click(buttons("Expand all"))
    focusNode("Thylakoids")

    await user.click(buttons("Collapse all"))

    expect(node("Photosynthesis")).toHaveAttribute("tabindex", "0")
  })
})

describe("MindMapViewer: pan and zoom", () => {
  it("fits on mount and the Fit button restores the fit", async () => {
    const { user } = renderViewer()
    const fitted = transformOf()
    expect(fitted).toMatch(/^translate\(.+\) scale\(/)

    await user.click(buttons("Zoom in"))
    expect(transformOf()).not.toBe(fitted)

    await user.click(buttons("Fit to screen"))
    expect(transformOf()).toBe(fitted)
  })

  it("zooms in and out with the buttons", async () => {
    const { user } = renderViewer()
    const initial = scaleOf()

    await user.click(buttons("Zoom in"))
    const zoomedIn = scaleOf()
    expect(zoomedIn).toBeGreaterThan(initial)

    await user.click(buttons("Zoom out"))
    await user.click(buttons("Zoom out"))
    expect(scaleOf()).toBeLessThan(initial)
  })

  it("zooms with Ctrl + wheel but lets a plain wheel scroll the page", () => {
    renderViewer()
    const canvas = document.querySelector('[data-slot="mind-map-canvas"]')
    if (!canvas) throw new Error("no canvas")
    const initial = transformOf()
    // happy-dom's WheelEvent ignores the modifier keys, so the event is built by hand.
    const wheel = (modifiers: { ctrlKey?: boolean; metaKey?: boolean }) => {
      const event = new Event("wheel", { bubbles: true, cancelable: true })
      Object.assign(event, {
        deltaY: -100,
        deltaMode: 0,
        clientX: 0,
        clientY: 0,
        ctrlKey: false,
        metaKey: false,
        ...modifiers,
      })
      act(() => {
        canvas.dispatchEvent(event)
      })
      return event
    }

    expect(wheel({}).defaultPrevented).toBe(false)
    expect(transformOf()).toBe(initial)

    expect(wheel({ ctrlKey: true }).defaultPrevented).toBe(true)
    const zoomed = scaleOf()
    expect(zoomed).toBeGreaterThan(Number(/scale\(([\d.]+)\)/.exec(initial)?.[1]))

    expect(wheel({ metaKey: true }).defaultPrevented).toBe(true)
    expect(scaleOf()).toBeGreaterThan(zoomed)
  })

  it("pans by dragging, and a drag does not open a node", () => {
    renderViewer()
    const canvas = document.querySelector('[data-slot="mind-map-canvas"]')
    const item = node("Calvin cycle")
    if (!canvas) throw new Error("no canvas")
    const initial = transformOf()

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      button: 0,
    })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 160, clientY: 130 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 160, clientY: 130 })
    fireEvent.click(item)

    expect(transformOf()).not.toBe(initial)
    expect(scaleOf()).toBe(Number(/scale\(([\d.]+)\)/.exec(initial)?.[1]))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("applies the transform to a single group", () => {
    renderViewer()

    expect(document.querySelectorAll('[data-slot="mind-map-viewport"]')).toHaveLength(1)
    expect(viewport()?.querySelectorAll('[role="treeitem"]')).toHaveLength(5)
  })
})

describe("MindMapViewer: outline view", () => {
  it("lists the map as nested lists with disclosure buttons", async () => {
    const { user } = renderViewer()

    await user.click(buttons("Outline view"))

    expect(buttons("Outline view")).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByRole("tree")).not.toBeInTheDocument()
    const list = screen.getByRole("list", {
      name: /Mind map outline: Photosynthesis/,
    })
    expect(within(list).getByText("Photosynthesis")).toBeInTheDocument()
    expect(within(list).getByText("Chloroplast")).toBeInTheDocument()
    expect(within(list).queryByText("Thylakoids")).not.toBeInTheDocument()

    await user.click(buttons("Expand all"))
    for (const label of mindMapContent.nodes.map((item) => item.label)) {
      expect(within(list).getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it("expands and collapses with the disclosure buttons and keeps aria-expanded right", async () => {
    const { user } = renderViewer()
    await user.click(buttons("Outline view"))

    const disclosure = buttons("Expand: Chloroplast")
    expect(disclosure).toHaveAttribute("aria-expanded", "false")
    await user.click(disclosure)

    const open = buttons("Collapse: Chloroplast")
    expect(open).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Thylakoids")).toBeInTheDocument()

    await user.click(open)
    expect(screen.queryByText("Thylakoids")).not.toBeInTheDocument()
  })

  it("has the same Ask in chat and Show sources actions", async () => {
    const { user, actions } = renderViewer()
    await user.click(buttons("Outline view"))

    const row = document.querySelector<HTMLElement>('[data-node-id="n4"]')
    if (!row) throw new Error("no row")
    await user.click(
      within(row).getAllByRole("button", {
        name: "Ask in chat",
      })[0] as HTMLElement,
    )
    expect(actions.ask).toHaveBeenCalledWith({
      text: "Explain “Calvin cycle” using my sources.",
      anchor: { kind: "passages", ids: [passageId(1, 5)] },
    })

    await user.click(
      within(row).getAllByRole("button", {
        name: "Show sources",
      })[0] as HTMLElement,
    )
    expect(actions.openSource).toHaveBeenCalledWith(nbIds.sourceFile, passageId(1, 5))
  })

  it("goes back to the map and remembers the choice for the session", async () => {
    const first = renderViewer()
    await first.user.click(buttons("Outline view"))
    expect(window.sessionStorage.getItem("ihsp.notebooks.mindmap.view")).toBe("outline")
    first.unmount()

    const second = renderViewer()
    expect(screen.queryByRole("tree")).not.toBeInTheDocument()
    await second.user.click(buttons("Outline view"))
    expect(screen.getByRole("tree")).toBeInTheDocument()
    expect(window.sessionStorage.getItem("ihsp.notebooks.mindmap.view")).toBe("map")
  })

  it("still works when the storage throws", async () => {
    const spy = spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const { user } = renderViewer()

    await user.click(buttons("Outline view"))

    expect(screen.queryByRole("tree")).not.toBeInTheDocument()
    spy.mockRestore()
  })
})

describe("MindMapViewer: downloads", () => {
  it("downloads the outline as Markdown", async () => {
    const spy = spyOn(download, "downloadText").mockImplementation(() => undefined)
    const { user } = renderViewer()

    await user.click(buttons("Download outline (.md)"))

    expect(spy).toHaveBeenCalledTimes(1)
    const [filename, content, mime] = spy.mock.calls[0] ?? []
    expect(filename).toBe("photosynthesis.md")
    expect(content).toContain("- Photosynthesis\n  - Chloroplast\n    - Thylakoids\n    - Stroma\n  - Light reactions")
    expect(content).toContain("\n      - CO2 fixation")
    expect(mime).toContain("markdown")
  })

  it("draws the map into a canvas and downloads the PNG", async () => {
    const blob = new Blob(["png"], { type: "image/png" })
    const drawn: Array<[number, number]> = []
    const getContext = spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => ({
      drawImage: (_image: unknown, _x: number, _y: number, width: number, height: number) => {
        drawn.push([width, height])
      },
    })) as never)
    const toBlob = spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback: BlobCallback) =>
      callback(blob),
    )
    const RealImage = globalThis.Image
    globalThis.Image = FakeImage as unknown as typeof Image
    const spy = spyOn(download, "downloadBlob").mockImplementation(() => undefined)
    try {
      const { user } = renderViewer()

      await user.click(buttons("Download PNG"))

      await waitFor(() => expect(spy).toHaveBeenCalledWith("photosynthesis.png", blob))
      expect(drawn).toHaveLength(1)
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    } finally {
      globalThis.Image = RealImage
      getContext.mockRestore()
      toBlob.mockRestore()
    }
  })

  it("shows an error instead of failing when the browser has no canvas", async () => {
    const spy = spyOn(download, "downloadBlob").mockImplementation(() => undefined)
    const { user } = renderViewer()

    await user.click(buttons("Download PNG"))

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not create the PNG in this browser.")
    expect(spy).not.toHaveBeenCalled()
  })

  it("offers to copy the outline inside Telegram only", async () => {
    const outside = renderViewer()
    expect(screen.queryByRole("button", { name: "Copy outline" })).not.toBeInTheDocument()
    outside.unmount()

    openAsMiniApp()
    const { user } = renderViewer()
    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined)

    await user.click(buttons("Copy outline"))

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(String(writeText.mock.calls[0]?.[0])).toContain("- Photosynthesis\n  - Chloroplast")
  })
})

function bigMap(): MindMapContent {
  const nodes: MindMapNode[] = [{ id: "root", parent_id: null, label: "Root", note: "", refs: [] }]
  for (let branch = 0; branch < 6; branch++) {
    nodes.push({
      id: `b${branch}`,
      parent_id: "root",
      label: `Branch ${branch}`,
      note: "",
      refs: [],
    })
    for (let child = 0; child < 3; child++) {
      nodes.push({
        id: `b${branch}c${child}`,
        parent_id: `b${branch}`,
        label: `Concept ${branch}.${child}`,
        note: "",
        refs: [],
      })
      for (let leaf = 0; leaf < 2; leaf++) {
        nodes.push({
          id: `b${branch}c${child}l${leaf}`,
          parent_id: `b${branch}c${child}`,
          label: `A fairly long detail label ${branch}.${child}.${leaf}`,
          note: "",
          refs: [],
        })
      }
    }
  }
  return { title: "Big", nodes: nodes.slice(0, 60) }
}

describe("MindMapViewer: a 60-node map", () => {
  it("renders every node after Expand all and stays operable", async () => {
    const { user } = renderViewer(mindMapArtifact(bigMap()))
    expect(screen.getAllByRole("treeitem")).toHaveLength(7)

    const started = performance.now()
    await user.click(buttons("Expand all"))

    expect(screen.getAllByRole("treeitem")).toHaveLength(60)
    expect(performance.now() - started).toBeLessThan(5000)
    // Nodes of one depth share a column.
    const xs = new Set(
      screen
        .getAllByRole("treeitem")
        .filter((item) => item.getAttribute("aria-level") === "2")
        .map((item) => item.getAttribute("transform")?.split(" ")[0]),
    )
    expect(xs.size).toBe(1)
  })
})

/** Telegram opens a mini app with its launch parameters in the URL hash. */
function openAsMiniApp(): void {
  const data = new URLSearchParams({
    query_id: "AAH",
    user: JSON.stringify({ id: 1, first_name: "A" }),
    auth_date: "1700000000",
    hash: "abc",
    signature: "sig",
  })
  const params = new URLSearchParams({
    tgWebAppData: data.toString(),
    tgWebAppVersion: "8.0",
    tgWebAppPlatform: "tdesktop",
    tgWebAppThemeParams: "{}",
  })
  window.location.hash = `#${params.toString()}`
  expect(isMiniApp()).toBe(true)
}
