import { describe, expect, test } from "bun:test"
import {
  MIN_SIDE,
  NUDGE_STEP,
  NUDGE_STEP_LARGE,
  boxStyle,
  clampBox,
  fontPx,
  moveBox,
  newField,
  nudgeBox,
  pxToFraction,
  remainingToTier,
  resizeBox,
  squareQr,
  tierKey,
} from "./layout"

const box = { x: 0.2, y: 0.3, w: 0.4, h: 0.1 }

describe("pxToFraction", () => {
  test("divides by the rendered size", () => {
    expect(pxToFraction(50, 20, { width: 500, height: 200 })).toEqual({ dx: 0.1, dy: 0.1 })
  })
  test("a zero-size canvas moves nothing", () => {
    expect(pxToFraction(50, 20, { width: 0, height: 0 })).toEqual({ dx: 0, dy: 0 })
  })
})

describe("moveBox", () => {
  test("moves by fractions", () => {
    expect(moveBox(box, 0.1, -0.1)).toEqual({ x: 0.3, y: 0.2, w: 0.4, h: 0.1 })
  })
  test("stops at the edges without shrinking", () => {
    expect(moveBox(box, 5, 5)).toEqual({ x: 0.6, y: 0.9, w: 0.4, h: 0.1 })
    expect(moveBox(box, -5, -5)).toEqual({ x: 0, y: 0, w: 0.4, h: 0.1 })
  })
})

describe("resizeBox", () => {
  test("south-east grows width and height", () => {
    expect(resizeBox(box, "se", 0.1, 0.05)).toEqual({ x: 0.2, y: 0.3, w: 0.5, h: 0.15 })
  })
  test("north-west keeps the opposite corner", () => {
    expect(resizeBox(box, "nw", -0.1, -0.1)).toEqual({ x: 0.1, y: 0.2, w: 0.5, h: 0.2 })
  })
  test("never smaller than MIN_SIDE and never outside", () => {
    const tiny = resizeBox(box, "se", -1, -1)
    expect(tiny.w).toBeCloseTo(MIN_SIDE)
    expect(tiny.h).toBeCloseTo(MIN_SIDE)
    const wide = resizeBox(box, "ne", 5, -5)
    expect(wide).toEqual({ x: 0.2, y: 0, w: 0.8, h: 0.4 })
  })
})

describe("nudgeBox", () => {
  test("arrows move by a small step, Shift by a large one", () => {
    expect(nudgeBox(box, "ArrowRight")?.x).toBeCloseTo(0.2 + NUDGE_STEP)
    expect(nudgeBox(box, "ArrowUp", { large: true })?.y).toBeCloseTo(0.3 - NUDGE_STEP_LARGE)
  })
  test("Alt resizes instead", () => {
    expect(nudgeBox(box, "ArrowDown", { resize: true })).toEqual({ x: 0.2, y: 0.3, w: 0.4, h: 0.105 })
  })
  test("other keys do nothing", () => {
    expect(nudgeBox(box, "Enter")).toBeNull()
  })
})

describe("clampBox / boxStyle / fontPx", () => {
  test("clampBox pulls a box back inside", () => {
    expect(clampBox({ x: 0.9, y: -0.2, w: 0.3, h: 0.001 })).toEqual({ x: 0.7, y: 0, w: 0.3, h: MIN_SIDE })
  })
  test("boxStyle gives percentages", () => {
    expect(boxStyle(box)).toEqual({ left: "20%", top: "30%", width: "40%", height: "10%" })
  })
  test("fontPx scales with the canvas height", () => {
    expect(fontPx(0.05, 400)).toBe(20)
  })
})

describe("squareQr and newField", () => {
  test("a QR is square on a landscape page", () => {
    const qr = squareQr({ x: 0.8, y: 0.7, w: 0.1, h: 0.1 }, { width_px: 2000, height_px: 1000 })
    expect(qr.h).toBeCloseTo(0.2)
  })
  test("new fields fit inside the template", () => {
    for (const key of ["name", "qr", "code", "custom_text"] as const) {
      const field = newField(key, { width_px: 3508, height_px: 2480 })
      expect(field.x + field.w).toBeLessThanOrEqual(1)
      expect(field.y + field.h).toBeLessThanOrEqual(1)
    }
    expect(newField("custom_text", { width_px: 1, height_px: 1 }).text).toBe("")
  })
})

describe("tierKey / remainingToTier", () => {
  test("slugifies and stays unique", () => {
    expect(tierKey("With honors!", [])).toBe("with_honors")
    expect(tierKey("With honors", ["with_honors"])).toBe("with_honors_2")
    expect(tierKey("Отличие", [])).toBe("tier")
  })
  test("points still missing", () => {
    expect(remainingToTier(72.4, { min_pct: 90 }, 60)).toBe(18)
    expect(remainingToTier(50, null, 60)).toBe(10)
    expect(remainingToTier(95, { min_pct: null }, 60)).toBe(0)
  })
})
