import { afterEach, describe, expect, it, spyOn } from "bun:test"
import type { ArtifactDetail } from "@ihsp/api"
import { artifactDetailOf, artifactMindMap, nbIds, passageId } from "@ihsp/test-utils"
import { act, fireEvent, screen, within } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../../test-support"
import { MindMapViewer } from "./mind-map-viewer"

allowSlowRenders()

function renderViewer() {
  const detail: ArtifactDetail = artifactDetailOf(artifactMindMap)
  if (detail.kind !== "mind_map") throw new Error("the fixture is not a mind map")
  return renderNotebook(<MindMapViewer notebookId={nbIds.notebook} artifact={detail} />)
}

const canvas = () => {
  const element = document.querySelector<HTMLElement>('[data-slot="mind-map-canvas"]')
  if (!element) throw new Error("no canvas")
  return element
}
const transformOf = () => document.querySelector<SVGGElement>('[data-slot="mind-map-viewport"]')?.style.transform ?? ""
const scaleOf = () => Number(/scale\(([\d.]+)\)/.exec(transformOf())?.[1])
const viewportGroup = () => document.querySelector<SVGGElement>('[data-slot="mind-map-viewport"]')

const resizeCallbacks: Array<() => void> = []
class FakeResizeObserver {
  constructor(callback: () => void) {
    resizeCallbacks.push(callback)
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
const node = (name: string) => screen.getByRole("treeitem", { name })

/** `useIsMobile` reads `window.innerWidth`; other test files may have replaced it with a plain value, so set it so. */
function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width })
  act(() => {
    window.dispatchEvent(new Event("resize"))
  })
}

afterEach(() => setViewportWidth(1280))

describe("MindMapViewer: gestures", () => {
  it("zooms with a two-pointer pinch", () => {
    renderViewer()
    const initial = scaleOf()

    fireEvent.pointerDown(canvas(), { pointerId: 1, clientX: 100, clientY: 100, button: 0 })
    fireEvent.pointerDown(canvas(), { pointerId: 2, clientX: 200, clientY: 100, button: 0 })
    fireEvent.pointerMove(canvas(), { pointerId: 2, clientX: 300, clientY: 100 })
    const zoomedIn = scaleOf()
    expect(zoomedIn).toBeGreaterThan(initial)

    fireEvent.pointerMove(canvas(), { pointerId: 2, clientX: 120, clientY: 100 })
    expect(scaleOf()).toBeLessThan(zoomedIn)

    fireEvent.pointerUp(canvas(), { pointerId: 2 })
    fireEvent.pointerUp(canvas(), { pointerId: 1 })
  })

  it("ignores the secondary mouse button", () => {
    renderViewer()
    const initial = transformOf()

    fireEvent.pointerDown(canvas(), { pointerId: 1, clientX: 100, clientY: 100, button: 2, pointerType: "mouse" })
    fireEvent.pointerMove(canvas(), { pointerId: 1, clientX: 200, clientY: 200 })
    fireEvent.pointerUp(canvas(), { pointerId: 1 })

    expect(transformOf()).toBe(initial)
  })

  it("fits again when the canvas is resized", () => {
    resizeCallbacks.length = 0
    const RealObserver = globalThis.ResizeObserver
    globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver
    renderViewer()
    const initial = transformOf()

    const rect = spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 300,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 400,
      bottom: 300,
      toJSON: () => ({}),
    })
    // The first notification only reports the size the map was just fitted to; the second is a real resize.
    act(() => resizeCallbacks.forEach((callback) => callback()))
    act(() => resizeCallbacks.forEach((callback) => callback()))

    expect(transformOf()).not.toBe(initial)
    rect.mockRestore()
    globalThis.ResizeObserver = RealObserver
  })

  it("moves with the zoom: nodes stay in one memoized layer while the group transform changes", () => {
    renderViewer()
    const before = node("Calvin cycle").getAttribute("transform")

    fireEvent.pointerDown(canvas(), { pointerId: 1, clientX: 10, clientY: 10, button: 0 })
    fireEvent.pointerMove(canvas(), { pointerId: 1, clientX: 80, clientY: 90 })
    fireEvent.pointerUp(canvas(), { pointerId: 1 })

    expect(node("Calvin cycle").getAttribute("transform")).toBe(before)
  })

  it("only animates button-driven changes, and only when motion is allowed", async () => {
    const { user } = renderViewer()
    expect(viewportGroup()?.getAttribute("class") ?? "").not.toContain("transition")

    await user.click(screen.getByRole("button", { name: "Zoom in" }))
    expect(viewportGroup()?.getAttribute("class")).toContain("motion-safe:transition-transform")

    fireEvent.pointerDown(canvas(), { pointerId: 1, clientX: 10, clientY: 10, button: 0 })
    fireEvent.pointerMove(canvas(), { pointerId: 1, clientX: 80, clientY: 90 })
    expect(viewportGroup()?.getAttribute("class") ?? "").not.toContain("transition")
    fireEvent.pointerUp(canvas(), { pointerId: 1 })
  })
})

describe("MindMapViewer: on a phone", () => {
  it("opens the details as a bottom sheet with the same actions", async () => {
    setViewportWidth(400)
    const { user, actions } = renderViewer()

    await user.click(node("Light reactions"))

    const sheet = await screen.findByRole("dialog")
    expect(document.querySelector('[data-slot="mind-map-details"]') === null).toBe(true)
    expect(within(sheet).getByText("Light reactions")).toBeInTheDocument()
    expect(within(sheet).getByText("Take place in the thylakoid membranes.")).toBeInTheDocument()

    await user.click(within(sheet).getByRole("button", { name: "Ask in chat" }))
    expect(actions.ask).toHaveBeenCalledWith({
      text: "Explain “Light reactions” using my sources.",
      anchor: { kind: "passages", ids: [passageId(1, 3)] },
    })
  })

  it("keeps every toolbar button at least 44 px by class", () => {
    renderViewer()

    for (const button of within(screen.getByRole("group", { name: "Mind map tools" })).getAllByRole("button")) {
      expect(button.className).toContain("size-11")
    }
  })
})
