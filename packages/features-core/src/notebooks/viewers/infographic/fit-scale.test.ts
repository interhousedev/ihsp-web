import { describe, expect, it } from "bun:test"
import { MAX_ZOOM, MIN_ZOOM, fitScale, stepZoom } from "./fit-scale"

describe("fitScale", () => {
  it("shrinks a canvas that is wider than its container", () => {
    expect(fitScale(400, 800)).toBe(0.5)
  })

  it("never enlarges the canvas", () => {
    expect(fitScale(1600, 800)).toBe(1)
  })

  it("falls back to 100 % when the container has no width (not laid out yet)", () => {
    expect(fitScale(0, 800)).toBe(1)
    expect(fitScale(Number.NaN, 800)).toBe(1)
  })
})

describe("stepZoom", () => {
  it("steps by ten percent without float noise", () => {
    expect(stepZoom(1, 1)).toBe(1.1)
    expect(stepZoom(1.1, 1)).toBe(1.2)
    expect(stepZoom(0.7, -1)).toBe(0.6)
  })

  it("stays inside the limits", () => {
    expect(stepZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM)
    expect(stepZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM)
  })
})
