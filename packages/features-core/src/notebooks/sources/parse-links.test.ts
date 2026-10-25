import { describe, expect, it } from "bun:test"
import { parseLinks } from "./parse-links"

describe("parseLinks", () => {
  it("splits on spaces and new lines and keeps the order", () => {
    const { urls, skipped } = parseLinks("https://a.example/x  https://b.example\nhttp://c.example/y?q=1")

    expect(urls).toEqual(["https://a.example/x", "https://b.example", "http://c.example/y?q=1"])
    expect(skipped).toEqual([])
  })

  it("drops duplicates and reports what is not a web address", () => {
    const { urls, skipped } = parseLinks("https://a.example\nhttps://a.example\nnot-a-link ftp://files.example")

    expect(urls).toEqual(["https://a.example"])
    expect(skipped).toEqual(["not-a-link", "ftp://files.example"])
  })

  it("returns nothing for blank text", () => {
    expect(parseLinks("  \n ")).toEqual({ urls: [], skipped: [] })
  })
})
