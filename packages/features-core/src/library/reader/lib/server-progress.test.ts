import { describe, expect, it } from "bun:test"
import { serverProgressOf } from "./server-progress"

describe("serverProgressOf", () => {
  const item = { progress: { file_id: "f1", locator: { page: 44 }, percent: 18 } }

  it("reads the saved position of the file", () => {
    expect(serverProgressOf(item, "f1")).toEqual({ locator: { page: 44 }, fraction: 0.18 })
    expect(
      serverProgressOf(
        { progress: { file_id: "f1", locator: { cfi: "epubcfi(/6/8)", progress: 0.4 }, percent: 40 } },
        "f1",
      ),
    ).toEqual({ locator: { cfi: "epubcfi(/6/8)", progress: 0.4 }, fraction: 0.4 })
  })

  it("ignores another file, a missing value and a damaged one", () => {
    expect(serverProgressOf(item, "f2")).toBeNull()
    expect(serverProgressOf({}, "f1")).toBeNull()
    expect(serverProgressOf({ progress: null }, "f1")).toBeNull()
    expect(serverProgressOf({ progress: { file_id: "f1", locator: { page: 0 }, percent: 5 } }, "f1")).toBeNull()
    expect(
      serverProgressOf({ progress: { file_id: "f1", locator: { cfi: "nope", progress: 1 }, percent: 5 } }, "f1"),
    ).toBeNull()
  })

  it("keeps the fraction inside 0..1", () => {
    expect(serverProgressOf({ progress: { file_id: "f1", locator: { page: 2 }, percent: 400 } }, "f1")?.fraction).toBe(
      1,
    )
  })
})
