import { describe, expect, it } from "bun:test"
import {
  decodeCfiLocation,
  encodeCfiLocation,
  fractionPage,
  locatorToHrefParams,
  pageFraction,
  parseLocator,
  parsePageParam,
  percentOf,
  readStoredFraction,
  readStoredPosition,
  writeStoredPosition,
} from "./locator"

describe("parsePageParam", () => {
  it("accepts whole numbers from 1", () => {
    expect(parsePageParam("12")).toBe(12)
    expect(parsePageParam(" 7 ")).toBe(7)
  })

  it("rejects zero, negatives, fractions, text and nothing", () => {
    for (const bad of ["0", "-3", "2.5", "abc", "", null, undefined, "1e3", "9999999"]) {
      expect(parsePageParam(bad as string | null | undefined)).toBeNull()
    }
  })
})

describe("CFI locations", () => {
  const cfi = "epubcfi(/6/8[chap2]!/4/2/10[p5]/3:12)"

  it("round-trips a CFI with its progress", () => {
    const text = encodeCfiLocation({ cfi, progress: 0.35 })

    expect(text).toBe(`${cfi}@0.35`)
    expect(decodeCfiLocation(text)).toEqual({ cfi, progress: 0.35 })
  })

  it("reads a bare CFI as progress 0", () => {
    expect(decodeCfiLocation(cfi)).toEqual({ cfi, progress: 0 })
  })

  it("keeps characters that CFIs use (brackets, carets, colons, commas)", () => {
    const tricky = "epubcfi(/6/4[a^]b]!/4/2,/1:0,/1:5)"

    expect(decodeCfiLocation(encodeCfiLocation({ cfi: tricky, progress: 1 }))).toEqual({ cfi: tricky, progress: 1 })
  })

  it("clamps the progress to 0..1 with four decimals", () => {
    expect(encodeCfiLocation({ cfi, progress: 1.7 })).toBe(`${cfi}@1`)
    expect(encodeCfiLocation({ cfi, progress: -2 })).toBe(`${cfi}@0`)
    expect(encodeCfiLocation({ cfi, progress: 0.123456 })).toBe(`${cfi}@0.1235`)
    expect(encodeCfiLocation({ cfi, progress: Number.NaN })).toBe(`${cfi}@0`)
  })

  it("refuses text that is not a CFI", () => {
    for (const bad of ["", null, undefined, "chapter-3", "epubcfi(", "javascript:alert(1)"]) {
      expect(decodeCfiLocation(bad as string | null | undefined)).toBeNull()
    }
  })
})

describe("parseLocator", () => {
  it("prefers a valid loc over page", () => {
    expect(parseLocator({ page: "3", loc: "epubcfi(/6/2)@0.5" })).toEqual({ cfi: "epubcfi(/6/2)", progress: 0.5 })
  })

  it("falls back to the page when loc is not a CFI", () => {
    expect(parseLocator({ page: "3", loc: "nope" })).toEqual({ page: 3 })
  })

  it("gives null when nothing usable is given", () => {
    expect(parseLocator({})).toBeNull()
    expect(parseLocator({ page: "x", loc: null })).toBeNull()
  })
})

describe("locatorToHrefParams", () => {
  it("is page for a PDF position and loc for an EPUB position", () => {
    expect(locatorToHrefParams({ page: 8 })).toEqual({ page: 8 })
    expect(locatorToHrefParams({ cfi: "epubcfi(/6/2)", progress: 0.2 })).toEqual({ loc: "epubcfi(/6/2)@0.2" })
    expect(locatorToHrefParams(null)).toEqual({})
  })

  it("survives the trip through readHref's query string", () => {
    const params = locatorToHrefParams({ cfi: "epubcfi(/6/8[x y]!/4/2)", progress: 0.35 })
    const query = new URLSearchParams({ loc: params.loc! })

    expect(parseLocator({ loc: new URLSearchParams(query.toString()).get("loc") })).toEqual({
      cfi: "epubcfi(/6/8[x y]!/4/2)",
      progress: 0.35,
    })
  })
})

describe("progress arithmetic", () => {
  it("turns fractions into percents with two decimals", () => {
    expect(percentOf(0.3567)).toBe(35.67)
    expect(percentOf(2)).toBe(100)
  })

  it("maps pages to a fraction and back", () => {
    expect(pageFraction(50, 200)).toBe(0.25)
    expect(pageFraction(999, 200)).toBe(1)
    expect(pageFraction(1, 0)).toBe(0)
    expect(fractionPage(0.25, 200)).toBe(50)
    expect(fractionPage(0, 200)).toBe(1)
    expect(fractionPage(1, 200)).toBe(200)
  })
})

describe("the position remembered on this device", () => {
  it("stores and reads a page and a CFI per file", () => {
    writeStoredPosition("item-1", "file-1", { page: 14 })
    writeStoredPosition("item-1", "file-2", { cfi: "epubcfi(/6/2)", progress: 0.1 })

    expect(readStoredPosition("item-1", "file-1")).toEqual({ page: 14 })
    expect(readStoredPosition("item-1", "file-2")).toEqual({ cfi: "epubcfi(/6/2)", progress: 0.1 })
    expect(readStoredPosition("item-2", "file-1")).toBeNull()
  })

  it("keeps the fraction for formats whose locator cannot hold it", () => {
    writeStoredPosition("item-1", "text", { page: 1 }, 0.4321)

    expect(readStoredFraction("item-1", "text")).toBe(0.4321)
    expect(readStoredFraction("item-1", "other")).toBeNull()
  })

  it("ignores damaged storage", () => {
    window.localStorage.setItem("ihsp.library.position", "{not json")
    expect(readStoredPosition("a", "b")).toBeNull()

    window.localStorage.setItem(
      "ihsp.library.position",
      JSON.stringify({ "a:b": { locator: { page: -4 }, at: "2026-01-01T00:00:00Z" } }),
    )
    expect(readStoredPosition("a", "b")).toBeNull()
  })

  it("keeps the most recent positions only", () => {
    for (let index = 0; index < 70; index += 1) {
      writeStoredPosition(`item-${index}`, "f", { page: 1 }, undefined, new Date(Date.UTC(2026, 0, 1, 0, index)))
    }

    expect(readStoredPosition("item-69", "f")).toEqual({ page: 1 })
    expect(readStoredPosition("item-0", "f")).toBeNull()
  })
})
