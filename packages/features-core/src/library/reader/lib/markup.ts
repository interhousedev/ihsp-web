import type { MarkupPages, MarkupShape, MarkupTool } from "@ihsp/api"

// Page markup of the PDF reader: shapes in fractions of the page (so they scale with the zoom), an undo/redo history
// and the hit test of the eraser. Pure functions, no DOM.

/** Shapes by page number. */
export type Pages = Record<number, MarkupShape[]>

export const MAX_POINTS = 2000
export const FIGURE_TOOLS: readonly MarkupTool[] = ["rect", "ellipse", "line", "arrow"]
export const STROKE_TOOLS: readonly MarkupTool[] = ["pen", "pencil", "highlighter"]
export const isFigure = (tool: MarkupTool) => FIGURE_TOOLS.includes(tool)

/** Stroke widths as fractions of the page width (about 1.5, 3 and 6 px on a 600 px page). */
export const MARKUP_WIDTHS = [0.0025, 0.005, 0.01] as const

export const clampPoint = (x: number, y: number): [number, number] => [
  Math.min(1, Math.max(0, x)),
  Math.min(1, Math.max(0, y)),
]

/** Keeps the first and last point and spreads the rest evenly, so a long stroke stays under the limit. */
export function thinPoints(points: readonly [number, number][], limit = MAX_POINTS): [number, number][] {
  if (points.length <= limit) return [...points]
  const out: [number, number][] = []
  const step = (points.length - 1) / (limit - 1)
  for (let index = 0; index < limit; index += 1) out.push(points[Math.round(index * step)]!)
  return out
}

/** The shape of a finished drag: a stroke keeps its path, a figure only its two ends. */
export function shapeFromDrag(
  tool: MarkupTool,
  color: string,
  width: number,
  points: readonly [number, number][],
  id: string,
): MarkupShape {
  const first = points[0]!
  const last = points.at(-1)!
  return {
    id,
    tool,
    color,
    width,
    points: isFigure(tool) ? [first, last] : thinPoints(points),
  }
}

export function serializeMarkup(pages: Pages): MarkupPages {
  const out: MarkupPages = {}
  for (const [page, shapes] of Object.entries(pages)) if (shapes.length > 0) out[page] = shapes
  return out
}

export function parseMarkup(pages: MarkupPages): Pages {
  const out: Pages = {}
  for (const [key, shapes] of Object.entries(pages)) {
    const page = Number(key)
    if (Number.isInteger(page) && page > 0 && shapes.length > 0) out[page] = shapes
  }
  return out
}

export const shapeCount = (pages: Pages): number => Object.values(pages).reduce((sum, shapes) => sum + shapes.length, 0)

/** Whether `pages` differ from what was saved (empty pages do not count). */
export const isDirty = (pages: Pages, saved: Pages): boolean =>
  JSON.stringify(serializeMarkup(pages)) !== JSON.stringify(serializeMarkup(saved))

export function addShape(pages: Pages, page: number, shape: MarkupShape): Pages {
  return { ...pages, [page]: [...(pages[page] ?? []), shape] }
}

// - - - History - - -

export type MarkupHistory = { past: Pages[]; present: Pages; future: Pages[] }
export type MarkupAction =
  | { type: "add"; page: number; shape: MarkupShape }
  | { type: "erase"; page: number; id: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "load"; pages: Pages }
  | { type: "clear" }

const HISTORY_LIMIT = 200

export const initialHistory = (pages: Pages = {}): MarkupHistory => ({ past: [], present: pages, future: [] })
export const canUndo = (state: MarkupHistory) => state.past.length > 0
export const canRedo = (state: MarkupHistory) => state.future.length > 0

function commit(state: MarkupHistory, next: Pages): MarkupHistory {
  return { past: [...state.past, state.present].slice(-HISTORY_LIMIT), present: next, future: [] }
}

export function markupReducer(state: MarkupHistory, action: MarkupAction): MarkupHistory {
  switch (action.type) {
    case "add":
      return commit(state, addShape(state.present, action.page, action.shape))
    case "erase": {
      const shapes = state.present[action.page]
      if (!shapes?.some((shape) => shape.id === action.id)) return state
      return commit(state, { ...state.present, [action.page]: shapes.filter((shape) => shape.id !== action.id) })
    }
    case "undo": {
      const previous = state.past.at(-1)
      if (!previous) return state
      return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] }
    }
    case "redo": {
      const [next, ...rest] = state.future
      if (!next) return state
      return { past: [...state.past, state.present], present: next, future: rest }
    }
    case "load":
      return initialHistory(action.pages)
    case "clear":
      return shapeCount(state.present) === 0 ? state : commit(state, {})
  }
}

// - - - Eraser - - -

type Point = readonly [number, number]

/** Distance from `p` to the segment `a`-`b`; y is scaled by `aspect` (page height over width) so distances are real. */
function segmentDistance(p: Point, a: Point, b: Point, aspect: number): number {
  const ax = a[0]
  const ay = a[1] * aspect
  const dx = b[0] - ax
  const dy = b[1] * aspect - ay
  const px = p[0] - ax
  const py = p[1] * aspect - ay
  const length = dx * dx + dy * dy
  const t = length === 0 ? 0 : Math.min(1, Math.max(0, (px * dx + py * dy) / length))
  return Math.hypot(px - t * dx, py - t * dy)
}

/** Whether `p` is within `tolerance` (a fraction of the page width) of the shape's ink. Figures count by outline. */
export function hitsShape(shape: MarkupShape, p: Point, tolerance: number, aspect: number): boolean {
  const reach = tolerance + shape.width / 2
  const points = shape.points
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) return false
  if (shape.tool === "rect") {
    const [x1, y1] = first
    const [x2, y2] = last
    const corners: Point[] = [first, [x2, y1], last, [x1, y2]]
    return corners.some((corner, index) => segmentDistance(p, corner, corners[(index + 1) % 4]!, aspect) <= reach)
  }
  if (shape.tool === "ellipse") {
    const cx = (first[0] + last[0]) / 2
    const cy = ((first[1] + last[1]) / 2) * aspect
    const rx = Math.abs(last[0] - first[0]) / 2
    const ry = (Math.abs(last[1] - first[1]) / 2) * aspect
    if (rx === 0 || ry === 0) return segmentDistance(p, first, last, aspect) <= reach
    // Sample the outline; precise enough for a tolerance of a few pixels.
    const steps = 64
    let previous: Point = [cx + rx, cy / aspect]
    for (let step = 1; step <= steps; step += 1) {
      const angle = (step / steps) * Math.PI * 2
      const next: Point = [cx + rx * Math.cos(angle), (cy + ry * Math.sin(angle)) / aspect]
      if (segmentDistance(p, previous, next, aspect) <= reach) return true
      previous = next
    }
    return false
  }
  if (points.length === 1) return Math.hypot(p[0] - first[0], (p[1] - first[1]) * aspect) <= reach
  for (let index = 1; index < points.length; index += 1) {
    if (segmentDistance(p, points[index - 1]!, points[index]!, aspect) <= reach) return true
  }
  return false
}

/** The id of the topmost shape under `p`, or null. */
export function eraseAt(shapes: readonly MarkupShape[], p: Point, tolerance: number, aspect: number): string | null {
  for (let index = shapes.length - 1; index >= 0; index -= 1) {
    if (hitsShape(shapes[index]!, p, tolerance, aspect)) return shapes[index]!.id
  }
  return null
}
