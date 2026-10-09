import { describe, expect, test } from "bun:test"
import { cardPlacement } from "./card-placement"

const canvas = { width: 800, height: 600 }

describe("cardPlacement", () => {
  test("goes under the node, centred on it", () => {
    const style = cardPlacement({ x: 380, y: 100, width: 100, height: 40 }, canvas)

    expect(style.width).toBe(320)
    expect(style.left).toBe(430 - 160)
    expect(style.top).toBe(150)
    expect(style.bottom).toBeUndefined()
  })

  test("goes above the node near the bottom edge", () => {
    const style = cardPlacement({ x: 380, y: 520, width: 100, height: 40 }, canvas)

    expect(style.top).toBeUndefined()
    expect(style.bottom).toBe(600 - 520 + 10)
  })

  test("stays inside the canvas horizontally", () => {
    expect(cardPlacement({ x: -50, y: 100, width: 100, height: 40 }, canvas).left).toBe(8)
    expect(cardPlacement({ x: 780, y: 100, width: 100, height: 40 }, canvas).left).toBe(800 - 320 - 8)
  })

  test("shrinks on a narrow canvas", () => {
    const style = cardPlacement({ x: 100, y: 100, width: 100, height: 40 }, { width: 360, height: 640 })

    expect(style.width).toBe(320)
    const narrow = cardPlacement({ x: 100, y: 100, width: 100, height: 40 }, { width: 300, height: 640 })
    expect(narrow.width).toBe(284)
    expect(narrow.left).toBe(8)
  })
})
