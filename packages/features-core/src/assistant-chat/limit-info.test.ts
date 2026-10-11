import { describe, expect, it } from "bun:test"
import type { UsageInfo } from "@ihsp/api"
import { formatTokens, limitState, smartState, usagePercent } from "./limit-info"

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

describe("no caps (Administration)", () => {
  const unlimited = usage({ session: { used: 5_000_000, limit: null }, day: { used: 9_000_000, limit: null } })

  it("never locks the input", () => {
    expect(limitState(unlimited)).toEqual({ reached: false })
  })

  it("has no percentage to show", () => {
    expect(usagePercent(5_000_000, null)).toBe(0)
  })
})

describe("smartState", () => {
  it("reads the smart requests of the week", () => {
    const state = smartState({
      ...usage(),
      smart_remaining: 2,
      smart_limit: 3,
      smart_resets_at: "2026-10-11T19:00:00Z",
    })

    expect(state).toEqual({ remaining: 2, limit: 3, resetsAt: "2026-10-11T19:00:00Z" })
  })

  it("is null for an unlimited user (staff) or an older backend", () => {
    expect(smartState({ ...usage(), smart_remaining: null, smart_limit: null, smart_resets_at: null })).toBeNull()
    expect(smartState(usage())).toBeNull()
    expect(smartState(undefined)).toBeNull()
  })
})
