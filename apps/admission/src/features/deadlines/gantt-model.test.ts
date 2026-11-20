import { describe, expect, test } from "bun:test"
import { chartRange, type Entry, toBlocks, utcDay } from "./gantt-model"

const base: Omit<Entry, "id" | "start" | "end"> = {
  rowId: "cal:university",
  rowLabel: "University",
  group: "deadlines",
  kind: "deadline",
  title: "MIT",
  tone: "warning",
  href: null,
  caption: "",
}

describe("toBlocks", () => {
  test("merges same-day deadlines on one row into one flag and keeps tasks as bars", () => {
    const day = utcDay("2026-11-30")
    const blocks = toBlocks([
      { ...base, id: "a", start: day, end: day },
      { ...base, id: "b", start: day, end: day, tone: "danger" },
      { ...base, id: "t", rowId: "task:1", group: "tasks", kind: "task", start: day - 86_400_000, end: day },
    ])
    expect(blocks).toHaveLength(2)
    const flag = blocks.find((block) => block.shape === "flag")!
    expect(flag.entries).toHaveLength(2)
    expect(flag.tone).toBe("danger")
    expect(blocks.find((block) => block.shape === "bar")!.entries[0]!.id).toBe("t")
  })
})

describe("chartRange", () => {
  test("covers a month back and a quarter ahead, capped at 400 days", () => {
    const today = utcDay("2026-11-21")
    const range = chartRange([], today)
    expect(range.start).toBe(today - 30 * 86_400_000)
    expect(range.end).toBe(today + 120 * 86_400_000)
    const far = toBlocks([{ ...base, id: "x", start: today + 900 * 86_400_000, end: today + 900 * 86_400_000 }])
    expect(chartRange(far, today).end).toBe(today + 400 * 86_400_000)
  })
})
