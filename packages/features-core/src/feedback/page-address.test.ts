import { describe, expect, it } from "bun:test"
import { pageAddressOf } from "./page-address"

describe("pageAddressOf", () => {
  it("keeps the origin and the path and drops the query and the hash", () => {
    expect(pageAddressOf("https://my.ihsu.uz/timetable/?code=abc123&state=xyz#token=secret")).toBe(
      "https://my.ihsu.uz/timetable/",
    )
  })

  it("refuses an address without an origin", () => {
    expect(pageAddressOf("about:blank")).toBeUndefined()
    expect(pageAddressOf("not a url")).toBeUndefined()
  })
})
