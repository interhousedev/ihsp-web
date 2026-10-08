import { describe, expect, it } from "bun:test"
import type { UsageInfo } from "@ihsp/api"
import { formatTokens, limitState, usagePercent } from "./limit-info"

function usage(
  overrides: { session?: Partial<UsageInfo["session"]>; day?: Partial<UsageInfo["day"]> } = {},
): UsageInfo {
  return {
    session: { used: 10, limit: 100, resets_at: "2026-10-07T08:00:00Z", ...overrides.session },
    day: { used: 10, limit: 100, resets_at: "2026-10-08T00:00:00Z", ...overrides.day },
  }
}

describe("limitState (AI-8, UF-WEB-21)", () => {
  it("is open while both budgets have room", () => {
    expect(limitState(usage())).toEqual({ reached: false })
  })

  it("locks with the session reset time when only the session is used up", () => {
    expect(limitState(usage({ session: { used: 100 } }))).toEqual({
      reached: true,
      scope: "session",
      resetsAt: "2026-10-07T08:00:00Z",
    })
  })

  it("locks with the day reset time when only the day is used up", () => {
    expect(limitState(usage({ day: { used: 120 } }))).toEqual({
      reached: true,
      scope: "day",
      resetsAt: "2026-10-08T00:00:00Z",
    })
  })

  it("waits for the later reset when both budgets are used up", () => {
    const state = limitState(usage({ session: { used: 100 }, day: { used: 100 } }))
    expect(state).toEqual({ reached: true, scope: "day", resetsAt: "2026-10-08T00:00:00Z" })
  })

  it("uses the day reset when the session has no reset time", () => {
    const state = limitState(usage({ session: { used: 100, resets_at: null } }))
    expect(state).toEqual({ reached: true, scope: "session", resetsAt: "2026-10-08T00:00:00Z" })
  })

  it("is open while the usage is not loaded", () => {
    expect(limitState(undefined)).toEqual({ reached: false })
  })
})

describe("usage formatting", () => {
  it("clamps the percentage", () => {
    expect(usagePercent(150, 100)).toBe(100)
    expect(usagePercent(-5, 100)).toBe(0)
    expect(usagePercent(5, 0)).toBe(0)
    expect(usagePercent(12_000, 100_000)).toBe(12)
  })

  it("shortens token counts", () => {
    expect(formatTokens(950)).toBe("950")
    expect(formatTokens(12_000)).toBe("12k")
    expect(formatTokens(1_500_000)).toBe("1.5M")
  })
})
