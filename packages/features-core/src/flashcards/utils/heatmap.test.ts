import { describe, expect, it } from "bun:test"
import { buildHeatmapWeeks, heatmapLevel, monthStarts } from "./heatmap"

describe("heatmapLevel", () => {
  it("is 0 without reviews and 1 to 4 relative to the busiest day", () => {
    expect(heatmapLevel(0, 40)).toBe(0)
    expect(heatmapLevel(5, 40)).toBe(1)
    expect(heatmapLevel(20, 40)).toBe(2)
    expect(heatmapLevel(30, 40)).toBe(3)
    expect(heatmapLevel(40, 40)).toBe(4)
  })

  it("is 0 when the year has no reviews at all", () => {
    expect(heatmapLevel(0, 0)).toBe(0)
  })
})

describe("buildHeatmapWeeks", () => {
  const weeks = buildHeatmapWeeks(2026, [{ date: "2026-10-07", count: 9 }], "2026-10-07")

  it("starts the weeks on Monday: 1 Jan 2026 is a Thursday", () => {
    expect(weeks[0]?.map((cell) => cell?.date ?? null)).toEqual([
      null,
      null,
      null,
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ])
  })

  it("covers every day of the year exactly once", () => {
    const dates = weeks.flat().flatMap((cell) => (cell ? [cell.date] : []))
    expect(dates).toHaveLength(365)
    expect(new Set(dates).size).toBe(365)
  })

  it("ends with 31 December and has 53 columns in 2026", () => {
    expect(weeks).toHaveLength(53)
    expect(weeks.at(-1)?.at(3)?.date).toBe("2026-12-31")
    expect(weeks.at(-1)?.at(4)).toBeNull()
  })

  it("carries the count and level of a studied day and marks days after today", () => {
    const cells = weeks.flat().flatMap((cell) => (cell ? [cell] : []))
    expect(cells.find((cell) => cell.date === "2026-10-07")).toMatchObject({ count: 9, level: 4, future: false })
    expect(cells.find((cell) => cell.date === "2026-10-08")).toMatchObject({ count: 0, level: 0, future: true })
    expect(cells.find((cell) => cell.date === "2026-10-06")).toMatchObject({ count: 0, future: false })
  })

  it("has 366 days in a leap year", () => {
    const leap = buildHeatmapWeeks(2024, [], "2026-10-07").flat().filter(Boolean)
    expect(leap).toHaveLength(366)
  })
})

describe("monthStarts", () => {
  it("lists the week where each month begins", () => {
    const starts = monthStarts(buildHeatmapWeeks(2026, [], "2026-10-07"))
    expect(starts).toHaveLength(12)
    expect(starts[0]).toEqual({ week: 0, month: 0 })
    // 1 Feb 2026 is a Sunday: the fifth week (index 4) holds it.
    expect(starts[1]).toEqual({ week: 4, month: 1 })
  })
})
