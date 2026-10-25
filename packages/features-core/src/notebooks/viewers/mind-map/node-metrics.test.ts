import { describe, expect, test } from "bun:test"
import type { MindMapNode } from "@ihsp/api"
import {
  LINE_HEIGHT,
  MAX_LINES,
  MAX_TEXT_WIDTH,
  PAD_X,
  PAD_Y,
  ROOT_PAD_X,
  estimateTextWidth,
  lineBaselines,
  measureNode,
  wrapLabel,
} from "./node-metrics"

function node(label: string, parent_id: string | null = "r"): MindMapNode {
  return { id: label, parent_id, label, note: "", refs: [] }
}

describe("estimateTextWidth", () => {
  test("is proportional: narrow letters are narrower than wide ones", () => {
    expect(estimateTextWidth("iiii")).toBeLessThan(estimateTextWidth("nnnn"))
    expect(estimateTextWidth("nnnn")).toBeLessThan(estimateTextWidth("mmmm"))
    expect(estimateTextWidth("abc")).toBeLessThan(estimateTextWidth("ABC"))
  })

  test("grows with the text and is zero for nothing", () => {
    expect(estimateTextWidth("")).toBe(0)
    expect(estimateTextWidth("Calvin cycle")).toBeGreaterThan(estimateTextWidth("Calvin"))
  })

  test("measures Cyrillic and CJK too", () => {
    expect(estimateTextWidth("Фотосинтез")).toBeGreaterThan(0)
    expect(estimateTextWidth("光合作用")).toBeGreaterThan(estimateTextWidth("abcd"))
  })
})

describe("wrapLabel", () => {
  test("keeps a short label on one line", () => {
    expect(wrapLabel("Calvin cycle")).toEqual(["Calvin cycle"])
  })

  test("wraps a long label at word boundaries within the maximum width", () => {
    const lines = wrapLabel("Light-dependent reactions in the thylakoid membrane of the chloroplast")

    expect(lines.length).toBeGreaterThan(1)
    expect(lines.length).toBeLessThanOrEqual(MAX_LINES)
    for (const line of lines) expect(estimateTextWidth(line)).toBeLessThanOrEqual(MAX_TEXT_WIDTH + 20)
    expect(lines.join(" ")).toBe("Light-dependent reactions in the thylakoid membrane of the chloroplast")
  })

  test("ends a label that does not fit into the lines with an ellipsis", () => {
    const lines = wrapLabel(Array.from({ length: 40 }, (_, i) => `word${i}`).join(" "))

    expect(lines).toHaveLength(MAX_LINES)
    expect(lines[MAX_LINES - 1]?.endsWith("…")).toBe(true)
  })

  test("breaks a single word that is wider than a line", () => {
    const lines = wrapLabel("W".repeat(60))

    expect(lines.length).toBeGreaterThan(1)
    expect(lines[0]?.length).toBeLessThan(60)
  })

  test("gives an empty label one empty line", () => {
    expect(wrapLabel("   ")).toEqual([""])
  })
})

describe("measureNode", () => {
  test("is as tall as its lines plus padding", () => {
    expect(measureNode(node("Short")).height).toBe(LINE_HEIGHT + PAD_Y * 2)
    expect(measureNode(node("Light-dependent reactions in the thylakoid membrane of the chloroplast")).height).toBe(
      3 * LINE_HEIGHT + PAD_Y * 2,
    )
  })

  test("widens with the label, and the root gets more padding", () => {
    const short = measureNode(node("Cell"))
    const long = measureNode(node("Photosynthesis"))
    const root = measureNode(node("Photosynthesis", null))

    expect(long.width).toBeGreaterThan(short.width)
    expect(root.width - long.width).toBe((ROOT_PAD_X - PAD_X) * 2)
  })

  test("is never narrower than it is tall", () => {
    const pill = measureNode(node("I"))

    expect(pill.width).toBeGreaterThanOrEqual(pill.height)
  })
})

describe("lineBaselines", () => {
  test("centres the block of lines", () => {
    const [first] = lineBaselines(1, LINE_HEIGHT + PAD_Y * 2)

    expect(first).toBeCloseTo(PAD_Y + LINE_HEIGHT * 0.72, 5)
    expect(lineBaselines(3, 3 * LINE_HEIGHT + PAD_Y * 2)).toHaveLength(3)
  })
})
