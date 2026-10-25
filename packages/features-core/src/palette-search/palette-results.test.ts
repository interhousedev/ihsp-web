import { describe, expect, test } from "bun:test"
import { staffRoutes, studentRoutes } from "./palette-results"

describe("palette routes", () => {
  test("the library base loses its trailing slashes", () => {
    expect(studentRoutes("https://lib.ihsu.uz///").libraryItem?.("42")).toBe("https://lib.ihsu.uz/item/?id=42")
    expect(staffRoutes("https://lib.ihsu.uz/").libraryItem?.("42")).toBe("https://lib.ihsu.uz/item/?id=42")
  })

  test("no library base means no library route", () => {
    expect(studentRoutes("").libraryItem).toBeNull()
    expect(staffRoutes(undefined).libraryItem).toBeNull()
  })

  test("a very long run of trailing slashes is trimmed quickly", () => {
    const started = performance.now()
    const routes = studentRoutes(`https://lib.ihsu.uz${"/".repeat(200_000)}`)
    expect(routes.libraryItem?.("1")).toBe("https://lib.ihsu.uz/item/?id=1")
    expect(performance.now() - started).toBeLessThan(1_000)
  })
})
