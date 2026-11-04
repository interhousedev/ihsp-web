import { describe, expect, test } from "bun:test"
import { pairCards, weekOf } from "./week-paging"

describe("homework week paging", () => {
  test("a week runs Monday to Friday around the anchor date", () => {
    // 2026-11-04 is a Wednesday
    expect(weekOf("2026-11-04")).toEqual({ from: "2026-11-02", to: "2026-11-06" })
  })

  test("a Sunday belongs to the week that ended on the Friday before it", () => {
    expect(weekOf("2026-11-08")).toEqual({ from: "2026-11-02", to: "2026-11-06" })
  })

  test("items are paired two per row for the side by side comparison", () => {
    expect(pairCards(["a", "b", "c"])).toEqual([["a", "b"], ["c"]])
    expect(pairCards([])).toEqual([])
  })
})
