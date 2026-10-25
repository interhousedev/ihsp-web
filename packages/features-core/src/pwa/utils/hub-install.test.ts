import { describe, expect, test } from "bun:test"
import { hubInstallUrl, installRequestUrl } from "./hub-install"

describe("hub install links", () => {
  test("the hub page for an app and the install request of an app", () => {
    expect(hubInstallUrl("https://app.ihsu.uz/", "library")).toBe("https://app.ihsu.uz/install/?app=library")
    expect(installRequestUrl("https://lib.ihsu.uz/")).toBe("https://lib.ihsu.uz/?install=1")
  })

  test("a very long run of trailing slashes is trimmed quickly", () => {
    const started = performance.now()
    const hub = `https://app.ihsu.uz${"/".repeat(200_000)}`
    expect(hubInstallUrl(hub, "lms")).toBe("https://app.ihsu.uz/install/?app=lms")
    expect(installRequestUrl(hub)).toBe("https://app.ihsu.uz/?install=1")
    expect(performance.now() - started).toBeLessThan(1_000)
  })
})
