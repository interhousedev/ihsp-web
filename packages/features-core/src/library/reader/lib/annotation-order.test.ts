import { describe, expect, it } from "bun:test"
import { byNewest, byPosition, positionOf } from "./annotation-order"

const at = (updated_at: string, locator: { page: number } | { cfi: string; progress: number }) => ({
  updated_at,
  locator,
})

describe("annotation order", () => {
  it("orders pages by page and EPUB places by progress", () => {
    expect(positionOf(at("", { page: 8 }))).toBe(8)
    expect(positionOf(at("", { cfi: "epubcfi(/6/2)", progress: 0.35 }))).toBe(0.35)
  })

  it("reads in the order of the file, then in the order of making", () => {
    const list = [at("2026-10-02", { page: 8 }), at("2026-10-05", { page: 2 }), at("2026-10-01", { page: 8 })]

    expect(byPosition(list).map((item) => [positionOf(item), item.updated_at])).toEqual([
      [2, "2026-10-05"],
      [8, "2026-10-01"],
      [8, "2026-10-02"],
    ])
  })

  it("puts the newest change first", () => {
    const list = [at("2026-10-01", { page: 1 }), at("2026-10-07", { page: 9 }), at("2026-10-03", { page: 4 })]

    expect(byNewest(list).map((item) => item.updated_at)).toEqual(["2026-10-07", "2026-10-03", "2026-10-01"])
  })

  it("does not change the list it was given", () => {
    const list = [at("2", { page: 2 }), at("1", { page: 1 })]
    byPosition(list)

    expect(list[0]?.updated_at).toBe("2")
  })
})
