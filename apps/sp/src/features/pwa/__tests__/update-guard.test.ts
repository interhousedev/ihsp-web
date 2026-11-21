/** Throttling of the version check and the guard against a forced-reload loop. */
import { describe, expect, test } from "bun:test"
import {
  FORCE_RELOAD_COOLDOWN_MS,
  VERSION_CHECK_MIN_INTERVAL_MS,
  mayForceReload,
  readForcedReload,
  shouldCheckVersion,
  writeForcedReload,
} from "../utils/update-guard"

describe("shouldCheckVersion", () => {
  test("the first check always runs", () => {
    expect(shouldCheckVersion(null, 1000)).toBe(true)
  })

  test("a burst of focus and online events is one request", () => {
    expect(shouldCheckVersion(1000, 1000 + VERSION_CHECK_MIN_INTERVAL_MS - 1)).toBe(false)
    expect(shouldCheckVersion(1000, 1000 + VERSION_CHECK_MIN_INTERVAL_MS)).toBe(true)
  })
})

describe("mayForceReload", () => {
  test("reloads when it has not tried for this version", () => {
    expect(mayForceReload(null, "1.3.0", 5000)).toBe(true)
    expect(mayForceReload({ target: "1.2.0", at: 4000 }, "1.3.0", 5000)).toBe(true)
  })

  test("does not reload again right after a reload that did not help", () => {
    expect(mayForceReload({ target: "1.3.0", at: 4000 }, "1.3.0", 5000)).toBe(false)
  })

  test("tries again after the cooldown", () => {
    expect(mayForceReload({ target: "1.3.0", at: 0 }, "1.3.0", FORCE_RELOAD_COOLDOWN_MS)).toBe(true)
  })
})

describe("the stored reload", () => {
  test("survives a reload in sessionStorage", () => {
    writeForcedReload({ target: "1.3.0", at: 42 })

    expect(readForcedReload()).toEqual({ target: "1.3.0", at: 42 })
  })

  test("ignores garbage", () => {
    window.sessionStorage.setItem("ihsp.pwa.forced-reload", "{nope")

    expect(readForcedReload()).toBeNull()
  })
})
