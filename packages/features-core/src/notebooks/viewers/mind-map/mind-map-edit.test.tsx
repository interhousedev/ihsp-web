import { describe, expect, it } from "bun:test"
import type { ArtifactDetail } from "@ihsp/api"
import { apiUrl, artifactDetailOf, artifactMindMap, nbIds, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../../test-support"
import { MindMapViewer } from "./mind-map-viewer"

allowSlowRenders()

type Saved = {
  state: {
    positions?: Record<string, { x: number; y: number }>
    nodes?: Array<{ label: string }>
    blocks?: Array<{ text: string }>
  }
}

function recordProgress(): Saved[] {
  const bodies: Saved[] = []
  server.use(
    http.put(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/:aid/progress`), async ({ request }) => {
      bodies.push((await request.json()) as Saved)
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return bodies
}

function renderViewer(progress: Record<string, unknown> | null = null) {
  const detail: ArtifactDetail = artifactDetailOf(artifactMindMap)
  if (detail.kind !== "mind_map") throw new Error("the fixture is not a mind map")
  return renderNotebook(
    <MindMapViewer notebookId={nbIds.notebook} artifact={{ ...detail, progress_state: progress }} />,
  )
}

const node = (name: string) => screen.getByRole("treeitem", { name })
const scaleOf = () =>
  Number(
    /scale\(([\d.]+)\)/.exec(
      document.querySelector<SVGGElement>('[data-slot="mind-map-viewport"]')?.style.transform ?? "",
    )?.[1],
  )
const at = (element: Element) => {
  const [x, y] =
    /translate\(([-\d.]+) ([-\d.]+)\)/
      .exec(element.getAttribute("transform") ?? "")
      ?.slice(1)
      .map(Number) ?? []
  return { x: x ?? Number.NaN, y: y ?? Number.NaN }
}
const label = (name: string) => screen.getByRole("treeitem", { name })

function drag(element: Element, dx: number, dy: number, pointerType = "mouse") {
  fireEvent.pointerDown(element, {
    pointerId: 7,
    pointerType,
    clientX: 100,
    clientY: 100,
    button: 0,
  })
  fireEvent.pointerMove(element, {
    pointerId: 7,
    pointerType,
    clientX: 100 + dx,
    clientY: 100 + dy,
  })
  fireEvent.pointerUp(element, {
    pointerId: 7,
    pointerType,
    clientX: 100 + dx,
    clientY: 100 + dy,
  })
}

describe("MindMapViewer: editing", () => {
  it("drags a node anywhere and saves its position", async () => {
    const saved = recordProgress()
    renderViewer()
    const target = label("Calvin cycle")
    const before = at(target)
    const k = scaleOf()

    drag(target, 80, 40)

    const after = at(label("Calvin cycle"))
    expect(after.x).toBeCloseTo(before.x + 80 / k, 1)
    expect(after.y).toBeCloseTo(before.y + 40 / k, 1)
    await waitFor(() =>
      expect(saved.at(-1)?.state.positions?.[target.getAttribute("data-node-id") ?? ""]).toBeDefined(),
    )
  })

  it("drags with a finger too, and the drag does not pan the map", () => {
    renderViewer()
    const target = label("Calvin cycle")
    const before = at(target)
    const transform = document.querySelector<SVGGElement>('[data-slot="mind-map-viewport"]')?.style.transform

    drag(target, 0, 60, "touch")

    expect(at(label("Calvin cycle")).y).toBeGreaterThan(before.y)
    expect(document.querySelector<SVGGElement>('[data-slot="mind-map-viewport"]')?.style.transform).toBe(transform)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("«Сжать» (Tidy up) puts every node back into the automatic layout", async () => {
    const saved = recordProgress()
    const { user } = renderViewer()
    const before = at(label("Calvin cycle"))
    drag(label("Calvin cycle"), 90, 90)
    expect(at(label("Calvin cycle"))).not.toEqual(before)

    await user.click(screen.getByRole("button", { name: "Tidy up" }))

    expect(at(label("Calvin cycle"))).toEqual(before)
    await waitFor(() => expect(saved.at(-1)?.state.positions).toEqual({}))
  })

  it("restores the saved positions", () => {
    renderViewer(null)
    const id = label("Calvin cycle").getAttribute("data-node-id") ?? ""
    document.body.innerHTML = ""
    renderViewer({ positions: { [id]: { x: 500, y: 300 } } })

    expect(at(label("Calvin cycle"))).toEqual({ x: 500, y: 300 })
  })

  it("adds a child, edits its text in place and saves the node", async () => {
    const saved = recordProgress()
    const { user } = renderViewer()
    const count = screen.getAllByRole("treeitem").length

    await user.click(label("Calvin cycle"))
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add child",
      }),
    )
    const field = await screen.findByRole("textbox", { name: "Node text" })
    await user.clear(field)
    await user.type(field, "Stomata{Enter}")

    expect(await screen.findByRole("treeitem", { name: "Stomata" })).toBeInTheDocument()
    // The branch opens to show the newcomer, so its other children appear as well.
    expect(screen.getAllByRole("treeitem").length).toBeGreaterThan(count)
    await waitFor(() => expect(saved.at(-1)?.state.nodes?.some((item) => item.label === "Stomata")).toBe(true))
  })

  it("adds a sibling next to the selected node", async () => {
    const { user } = renderViewer()
    const count = screen.getAllByRole("treeitem").length

    await user.click(label("Calvin cycle"))
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add sibling",
      }),
    )
    await user.keyboard("{Enter}")

    await waitFor(() => expect(screen.getAllByRole("treeitem")).toHaveLength(count + 1))
  })

  it("renames a node with a double click and cancels with Escape", async () => {
    const { user } = renderViewer()

    fireEvent.doubleClick(label("Calvin cycle"))
    const field = await screen.findByRole("textbox", { name: "Node text" })
    await user.clear(field)
    await user.type(field, "Dark reactions{Escape}")
    expect(screen.queryByRole("textbox", { name: "Node text" })).not.toBeInTheDocument()
    expect(screen.getByRole("treeitem", { name: "Calvin cycle" })).toBeInTheDocument()

    fireEvent.doubleClick(label("Calvin cycle"))
    const again = await screen.findByRole("textbox", { name: "Node text" })
    await user.clear(again)
    await user.type(again, "Dark reactions{Enter}")

    expect(await screen.findByRole("treeitem", { name: "Dark reactions" })).toBeInTheDocument()
  })

  it("deletes a node, but the root cannot be deleted", async () => {
    const saved = recordProgress()
    const { user } = renderViewer()
    const count = screen.getAllByRole("treeitem").length

    await user.click(label("Calvin cycle"))
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete",
      }),
    )

    await waitFor(() => expect(screen.queryByRole("treeitem", { name: "Calvin cycle" })).not.toBeInTheDocument())
    expect(screen.getAllByRole("treeitem").length).toBeLessThan(count)
    await waitFor(() => expect(saved.length).toBeGreaterThan(0))

    const root = screen.getAllByRole("treeitem").find((item) => item.getAttribute("aria-level") === "1")
    if (!root) throw new Error("no root")
    await user.click(root)
    expect(
      within(screen.getByRole("dialog")).queryByRole("button", {
        name: "Delete",
      }),
    ).not.toBeInTheDocument()
  })

  it("adds a free text block, drags it and saves it", async () => {
    const saved = recordProgress()
    const { user } = renderViewer()

    await user.click(screen.getByRole("button", { name: "Text block" }))
    const field = await screen.findByRole("textbox", { name: "Node text" })
    await user.clear(field)
    await user.type(field, "Remember this{Enter}")
    const block = await screen.findByRole("group", { name: "Remember this" })
    const before = at(block)

    drag(block, 30, 50)

    const after = at(screen.getByRole("group", { name: "Remember this" }))
    expect(after.y).toBeGreaterThan(before.y)
    await waitFor(() => expect(saved.at(-1)?.state.blocks?.[0]?.text).toBe("Remember this"))
    expect(node("Calvin cycle")).toBeInTheDocument()
  })
})
