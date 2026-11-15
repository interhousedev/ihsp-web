import { describe, expect, it } from "bun:test"
import type { MarkupShape } from "@ihsp/api"
import {
  addShape,
  canRedo,
  canUndo,
  clampPoint,
  eraseAt,
  hitsShape,
  initialHistory,
  isDirty,
  markupReducer,
  parseMarkup,
  serializeMarkup,
  shapeCount,
  shapeFromDrag,
  thinPoints,
} from "./markup"

const stroke = (id: string, extra: Partial<MarkupShape> = {}): MarkupShape => ({
  id,
  tool: "pen",
  color: "#ff0000",
  width: 0.004,
  points: [
    [0.1, 0.1],
    [0.4, 0.1],
  ],
  ...extra,
})

describe("markup serialization", () => {
  it("round-trips pages through the API shape (string keys, empty pages dropped)", () => {
    const pages = { 2: [stroke("a")], 7: [] as MarkupShape[], 9: [stroke("b", { tool: "rect" })] }
    const body = serializeMarkup(pages)
    expect(Object.keys(body)).toEqual(["2", "9"])
    expect(parseMarkup(body)).toEqual({ 2: [stroke("a")], 9: [stroke("b", { tool: "rect" })] })
  })

  it("ignores pages that are not positive integers when parsing", () => {
    expect(parseMarkup({ x: [stroke("a")], "0": [stroke("b")], "3": [stroke("c")] })).toEqual({ 3: [stroke("c")] })
  })

  it("keeps points as fractions of the page, whatever the zoom is", () => {
    const small = shapeFromDrag("pen", "#000000", 0.004, [[0.5, 0.25]], "x")
    expect(small.points).toEqual([[0.5, 0.25]])
    expect(clampPoint(1.4, -0.2)).toEqual([1, 0])
  })
})

describe("shapeFromDrag", () => {
  it("figures keep only the two ends", () => {
    const shape = shapeFromDrag(
      "rect",
      "#000000",
      0.004,
      [
        [0.1, 0.1],
        [0.2, 0.5],
        [0.6, 0.7],
      ],
      "r",
    )
    expect(shape.points).toEqual([
      [0.1, 0.1],
      [0.6, 0.7],
    ])
  })

  it("thins a stroke without losing the ends and stays within the limit", () => {
    const many: [number, number][] = Array.from({ length: 5000 }, (_, index) => [index / 5000, 0.5])
    const thin = thinPoints(many, 2000)
    expect(thin.length).toBeLessThanOrEqual(2000)
    expect(thin[0]).toEqual(many[0])
    expect(thin.at(-1)).toEqual(many.at(-1))
  })
})

describe("history", () => {
  it("adds, undoes and redoes shapes per page", () => {
    let state = initialHistory()
    state = markupReducer(state, { type: "add", page: 1, shape: stroke("a") })
    state = markupReducer(state, { type: "add", page: 1, shape: stroke("b") })
    expect(shapeCount(state.present)).toBe(2)
    expect(canUndo(state)).toBe(true)
    state = markupReducer(state, { type: "undo" })
    expect(state.present[1]?.map((shape) => shape.id)).toEqual(["a"])
    expect(canRedo(state)).toBe(true)
    state = markupReducer(state, { type: "redo" })
    expect(state.present[1]?.map((shape) => shape.id)).toEqual(["a", "b"])
  })

  it("a new action clears the redo stack", () => {
    let state = markupReducer(initialHistory(), { type: "add", page: 1, shape: stroke("a") })
    state = markupReducer(state, { type: "undo" })
    state = markupReducer(state, { type: "add", page: 2, shape: stroke("b") })
    expect(canRedo(state)).toBe(false)
  })

  it("erasing a shape is undoable", () => {
    let state = markupReducer(initialHistory(), { type: "add", page: 1, shape: stroke("a") })
    state = markupReducer(state, { type: "erase", page: 1, id: "a" })
    expect(shapeCount(state.present)).toBe(0)
    state = markupReducer(state, { type: "undo" })
    expect(shapeCount(state.present)).toBe(1)
  })

  it("loading replaces the pages and starts a fresh history", () => {
    let state = markupReducer(initialHistory(), { type: "add", page: 1, shape: stroke("a") })
    state = markupReducer(state, { type: "load", pages: { 4: [stroke("z")] } })
    expect(state.present).toEqual({ 4: [stroke("z")] })
    expect(canUndo(state)).toBe(false)
  })

  it("tells unsaved changes from the saved state", () => {
    const saved = { 1: [stroke("a")] }
    expect(isDirty(saved, saved)).toBe(false)
    expect(isDirty(addShape(saved, 1, stroke("b")), saved)).toBe(true)
    expect(isDirty({}, {})).toBe(false)
    expect(isDirty({ 3: [] }, {})).toBe(false)
  })
})

describe("eraser", () => {
  const line = stroke("l", {
    points: [
      [0.1, 0.5],
      [0.9, 0.5],
    ],
  })
  it("hits a stroke near its path and misses elsewhere", () => {
    expect(hitsShape(line, [0.5, 0.505], 0.02, 1.4)).toBe(true)
    expect(hitsShape(line, [0.5, 0.9], 0.02, 1.4)).toBe(false)
  })

  it("hits a rectangle by its outline, not its inside", () => {
    const rect = stroke("r", {
      tool: "rect",
      points: [
        [0.2, 0.2],
        [0.8, 0.8],
      ],
    })
    expect(hitsShape(rect, [0.2, 0.5], 0.02, 1)).toBe(true)
    expect(hitsShape(rect, [0.5, 0.5], 0.02, 1)).toBe(false)
  })

  it("hits an ellipse by its outline", () => {
    const ellipse = stroke("e", {
      tool: "ellipse",
      points: [
        [0.2, 0.2],
        [0.8, 0.8],
      ],
    })
    expect(hitsShape(ellipse, [0.8, 0.5], 0.02, 1)).toBe(true)
    expect(hitsShape(ellipse, [0.5, 0.5], 0.02, 1)).toBe(false)
  })

  it("erases the topmost shape under the point", () => {
    const shapes = [stroke("under"), stroke("over")]
    expect(eraseAt(shapes, [0.25, 0.1], 0.02, 1)).toBe("over")
    expect(eraseAt(shapes, [0.9, 0.9], 0.02, 1)).toBeNull()
  })
})
