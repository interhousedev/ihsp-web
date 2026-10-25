import { describe, expect, test } from "bun:test"
import {
  FIT_PADDING,
  MAX_FIT_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  clampScale,
  fitTransform,
  panIntoView,
  toScreen,
  transformCss,
  zoomAt,
} from "./transform"

const viewport = { width: 800, height: 400 }

describe("fitTransform", () => {
  test("shrinks a big map to fit with padding and centres it", () => {
    const fit = fitTransform({ x: 0, y: 0, width: 2000, height: 1000 }, viewport)

    expect(fit.k).toBeCloseTo((400 - FIT_PADDING * 2) / 1000, 5)
    expect(fit.x).toBeCloseTo((800 - 2000 * fit.k) / 2, 5)
    expect(fit.y).toBeCloseTo((400 - 1000 * fit.k) / 2, 5)
  })

  test("does not blow a small map up", () => {
    const fit = fitTransform({ x: 0, y: 0, width: 100, height: 40 }, viewport)

    expect(fit.k).toBe(MAX_FIT_SCALE)
    expect(fit.x).toBeCloseTo((800 - 100 * MAX_FIT_SCALE) / 2, 5)
  })

  test("takes the origin of the bounds into account", () => {
    const fit = fitTransform({ x: 50, y: 20, width: 100, height: 40 }, viewport)
    const box = toScreen(fit, { x: 50, y: 20, width: 100, height: 40 })

    expect(box.x + box.width / 2).toBeCloseTo(400, 5)
    expect(box.y + box.height / 2).toBeCloseTo(200, 5)
  })

  test("centres an empty map", () => {
    expect(fitTransform({ x: 0, y: 0, width: 0, height: 0 }, viewport)).toEqual({ x: 400, y: 200, k: 1 })
  })

  test("never goes below the minimum zoom", () => {
    expect(fitTransform({ x: 0, y: 0, width: 100_000, height: 100_000 }, viewport).k).toBe(MIN_SCALE)
  })
})

describe("zoomAt", () => {
  test("keeps the point under the cursor in place", () => {
    const start = { x: 10, y: 20, k: 1 }
    const next = zoomAt(start, 2, { x: 110, y: 120 })

    expect(next).toEqual({ x: -90, y: -80, k: 2 })
    // The world point (100, 100) was at (110, 120) and still is.
    expect(100 * next.k + next.x).toBe(110)
    expect(100 * next.k + next.y).toBe(120)
  })

  test("stays within the zoom limits", () => {
    expect(zoomAt({ x: 0, y: 0, k: 1 }, 100, { x: 0, y: 0 }).k).toBe(MAX_SCALE)
    expect(zoomAt({ x: 0, y: 0, k: 1 }, 0.001, { x: 0, y: 0 }).k).toBe(MIN_SCALE)
    expect(clampScale(1.5)).toBe(1.5)
  })
})

describe("panIntoView", () => {
  const transform = { x: 0, y: 0, k: 1 }

  test("leaves a visible box alone", () => {
    expect(panIntoView(transform, { x: 100, y: 100, width: 50, height: 30 }, viewport)).toBe(transform)
  })

  test("pans the smallest amount to bring a box in", () => {
    const moved = panIntoView(transform, { x: 900, y: 100, width: 100, height: 30 }, viewport, 16)

    expect(moved.x).toBe(800 - 16 - 1000)
    expect(moved.y).toBe(0)
    expect(moved.k).toBe(1)

    const back = panIntoView({ x: 0, y: 0, k: 1 }, { x: -50, y: -40, width: 20, height: 20 }, viewport, 16)
    expect(back.x).toBe(66)
    expect(back.y).toBe(56)
  })
})

describe("transformCss", () => {
  test("is a translate and a scale", () => {
    expect(transformCss({ x: 10.12345, y: -3, k: 1.25 })).toBe("translate(10.123px, -3px) scale(1.25)")
  })
})
