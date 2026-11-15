import { describe, expect, it } from "bun:test"
import robots, { dynamic } from "../robots"

describe("lms robots.txt", () => {
  it("is static and closes the whole signed-in app", () => {
    expect(dynamic).toBe("force-static")
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" })
  })
})
