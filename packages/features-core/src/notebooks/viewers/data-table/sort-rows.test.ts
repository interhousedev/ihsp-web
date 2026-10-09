import { describe, expect, it } from "bun:test"
import type { DataTableContent } from "@ihsp/api"
import { nextSort, parseDate, parseNumber, sortRows } from "./sort-rows"

const columns: DataTableContent["columns"] = [
  { key: "name", label: "Name", type: "text" },
  { key: "size", label: "Size", type: "number" },
  { key: "when", label: "When", type: "date" },
]
const row = (name: string, size: string, when: string) => ({ cells: { name, size, when }, refs: [] })
const rows = [
  row("beta", "10", "05.03.1873"),
  row("Alpha", "9", "1700"),
  row("gamma", "", "2001-04-02"),
  row("item 10", "1 200,5", ""),
  row("item 2", "-3", "March 5, 1900"),
]
const names = (key: string, direction: "asc" | "desc") =>
  sortRows(rows, columns, { key, direction }, "en").map(({ row: item }) => item.cells.name)

describe("parseNumber", () => {
  it("reads plain, signed and decorated numbers", () => {
    expect(parseNumber("12")).toBe(12)
    expect(parseNumber("-3.5")).toBe(-3.5)
    expect(parseNumber("45%")).toBe(45)
    expect(parseNumber("$4")).toBe(4)
  })

  it("understands both decimal and thousands separators", () => {
    expect(parseNumber("1 200,5")).toBe(1200.5)
    expect(parseNumber("1,200.5")).toBe(1200.5)
    expect(parseNumber("1.200,5")).toBe(1200.5)
    expect(parseNumber("12,5")).toBe(12.5)
    expect(parseNumber("1,234,567")).toBe(1234567)
  })

  it("gives null when there is no number", () => {
    expect(parseNumber("n/a")).toBeNull()
    expect(parseNumber("")).toBeNull()
  })
})

describe("parseDate", () => {
  it("reads ISO, day-first, month-year, year and English dates", () => {
    expect(parseDate("2001-04-02")).toBe(Date.UTC(2001, 3, 2))
    expect(parseDate("05.03.1873")).toBe(Date.UTC(1873, 2, 5))
    expect(parseDate("5/3/1873")).toBe(Date.UTC(1873, 2, 5))
    expect(parseDate("03.1873")).toBe(Date.UTC(1873, 2, 1))
    expect(parseDate("1700")).toBe(Date.UTC(1700, 0, 1))
    expect(parseDate("March 5, 1900")).not.toBeNull()
  })

  it("gives null for text that is not a date", () => {
    expect(parseDate("long ago")).toBeNull()
  })
})

describe("sortRows", () => {
  it("keeps the stored order without a sort", () => {
    expect(sortRows(rows, columns, null, "en").map(({ index }) => index)).toEqual([0, 1, 2, 3, 4])
  })

  it("sorts text naturally and ignoring case", () => {
    expect(names("name", "asc")).toEqual(["Alpha", "beta", "gamma", "item 2", "item 10"])
    expect(names("name", "desc")).toEqual(["item 10", "item 2", "gamma", "beta", "Alpha"])
  })

  it("sorts numbers by value and puts empty cells last in both directions", () => {
    expect(names("size", "asc")).toEqual(["item 2", "Alpha", "beta", "item 10", "gamma"])
    expect(names("size", "desc")).toEqual(["item 10", "beta", "Alpha", "item 2", "gamma"])
  })

  it("sorts dates by time", () => {
    expect(names("when", "asc")).toEqual(["Alpha", "beta", "item 2", "gamma", "item 10"])
  })

  it("ignores an unknown column", () => {
    expect(sortRows(rows, columns, { key: "zzz", direction: "asc" }, "en").map(({ index }) => index)).toEqual([
      0, 1, 2, 3, 4,
    ])
  })
})

describe("nextSort", () => {
  it("cycles ascending, descending, none, and restarts on another column", () => {
    const first = nextSort(null, "name")
    expect(first).toEqual({ key: "name", direction: "asc" })
    const second = nextSort(first, "name")
    expect(second).toEqual({ key: "name", direction: "desc" })
    expect(nextSort(second, "name")).toBeNull()
    expect(nextSort(second, "size")).toEqual({ key: "size", direction: "asc" })
  })
})
