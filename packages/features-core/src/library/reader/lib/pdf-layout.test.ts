import { describe, expect, it } from "bun:test"
import { PAGE_GAP, PAGE_PADDING, computeOffsets, fitScale, pageAtOffset, visibleRange } from "./pdf-layout"

describe("computeOffsets", () => {
  it("stacks pages of different heights with a gap and padding around", () => {
    const offsets = computeOffsets(3, (index) => [100, 200, 100][index]!)

    expect(offsets).toEqual([
      PAGE_PADDING,
      PAGE_PADDING + 100 + PAGE_GAP,
      PAGE_PADDING + 100 + PAGE_GAP + 200 + PAGE_GAP,
      PAGE_PADDING + 100 + PAGE_GAP + 200 + PAGE_GAP + 100 + PAGE_PADDING,
    ])
  })

  it("is only the padding for an empty document", () => {
    expect(computeOffsets(0, () => 0)).toEqual([PAGE_PADDING])
  })
})

describe("pageAtOffset", () => {
  const offsets = computeOffsets(5, () => 100)

  it("finds the page that contains a position", () => {
    expect(pageAtOffset(offsets, 0)).toBe(0)
    expect(pageAtOffset(offsets, offsets[2]! + 10)).toBe(2)
    expect(pageAtOffset(offsets, offsets[4]! + 99)).toBe(4)
  })

  it("stays inside the document", () => {
    expect(pageAtOffset(offsets, -50)).toBe(0)
    expect(pageAtOffset(offsets, 1_000_000)).toBe(4)
    expect(pageAtOffset([0], 10)).toBe(0)
  })

  it("is fast enough for a very long document (binary search)", () => {
    const huge = computeOffsets(100_000, () => 800)

    expect(pageAtOffset(huge, huge[77_777]! + 5)).toBe(77_777)
  })
})

describe("visibleRange", () => {
  const offsets = computeOffsets(100, () => 500)

  it("mounts the visible pages and a few around them, never the whole document", () => {
    const { first, last } = visibleRange(offsets, offsets[50]!, 800)

    expect(first).toBe(49)
    expect(last).toBeLessThanOrEqual(54)
    expect(last - first).toBeLessThan(8)
  })

  it("clamps at both ends", () => {
    expect(visibleRange(offsets, 0, 800).first).toBe(0)
    expect(visibleRange(offsets, offsets[99]!, 800).last).toBe(99)
    expect(visibleRange([0], 0, 800)).toEqual({ first: 0, last: -1 })
  })
})

describe("fitScale", () => {
  const page = { width: 600, height: 800 }
  const window = { width: 1200, height: 700 }

  it("fits the width", () => {
    expect(fitScale("width", window, page, 1, 0)).toBe(2)
  })

  it("fits the whole page when the window is lower than the page is tall", () => {
    expect(fitScale("page", window, page, 1, 0)).toBe(700 / 800)
  })

  it("custom zoom multiplies the fit-width scale", () => {
    expect(fitScale("custom", window, page, 1.5, 0)).toBe(3)
  })

  it("never divides by an unknown page size", () => {
    expect(fitScale("width", window, { width: 0, height: 0 }, 1)).toBe(1)
  })
})
