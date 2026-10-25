import { describe, expect, it } from "bun:test"
import { intervalLabel } from "./interval-label"

describe("intervalLabel (Anki shows steps inside the session as <10m)", () => {
  it("prefixes minutes with <", () => {
    expect(intervalLabel("1m")).toBe("<1m")
    expect(intervalLabel("10m")).toBe("<10m")
  })

  it("keeps hours, days and months as they are", () => {
    expect(intervalLabel("5h")).toBe("5h")
    expect(intervalLabel("1d")).toBe("1d")
    expect(intervalLabel("2mo")).toBe("2mo")
  })
})
