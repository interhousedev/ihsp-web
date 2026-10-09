/** The version check: when a build must update at once and when it is only offered the update. */
import { describe, expect, test } from "bun:test"
import { compareVersions, decideUpdate, parseVersion } from "../utils/app-version"

describe("parseVersion", () => {
  test("reads dotted numbers", () => {
    expect(parseVersion("1.4.2")).toEqual([1, 4, 2])
    expect(parseVersion("2")).toEqual([2])
    expect(parseVersion(" 1.10 ")).toEqual([1, 10])
  })

  test("rejects anything else", () => {
    for (const bad of ["", "abc", "1.x", "1..2", "v1.2", "1.2.3.4.5", "-1"]) expect(parseVersion(bad)).toBeNull()
  })
})

describe("compareVersions", () => {
  test("compares numbers, not text", () => {
    expect(compareVersions([1, 10], [1, 9])).toBe(1)
    expect(compareVersions([1, 2, 3], [1, 2, 4])).toBe(-1)
  })

  test("a missing segment is zero", () => {
    expect(compareVersions([1, 4], [1, 4, 0])).toBe(0)
    expect(compareVersions([1], [1, 0, 1])).toBe(-1)
  })
})

describe("decideUpdate", () => {
  const info = { latest: "1.5.0", min_supported: "1.3.0" }

  test("a build below min_supported must update now", () => {
    expect(decideUpdate("1.2.9", info)).toBe("force")
  })

  test("a build between min_supported and latest is offered the update", () => {
    expect(decideUpdate("1.3.0", info)).toBe("available")
    expect(decideUpdate("1.4.9", info)).toBe("available")
  })

  test("the latest build, or a newer one, does nothing", () => {
    expect(decideUpdate("1.5.0", info)).toBe("none")
    expect(decideUpdate("2.0.0", info)).toBe("none")
  })

  test("a force wins over an available update", () => {
    expect(decideUpdate("1.0.0", { latest: "9.0.0", min_supported: "1.0.1" })).toBe("force")
  })

  test("values that cannot be read never force anything", () => {
    expect(decideUpdate("1.0.0", { latest: "soon", min_supported: "?" })).toBe("none")
    expect(decideUpdate("dev", info)).toBe("none")
  })
})
