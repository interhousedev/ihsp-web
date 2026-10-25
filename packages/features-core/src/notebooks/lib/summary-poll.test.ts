import { describe, expect, test } from "bun:test"
import { SUMMARY_POLL_MS, SUMMARY_POLL_WINDOW_MS, createSummaryPoll } from "./summary-poll"

function clock(start = 1_000_000) {
  let now = start
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms
    },
  }
}

describe("createSummaryPoll", () => {
  test("polls every 4 seconds while the summary is stale or building", () => {
    const poll = createSummaryPoll(clock().now)

    expect(SUMMARY_POLL_MS).toBe(4000)
    expect(poll("n1", "stale")).toBe(4000)
    expect(poll("n1", "building")).toBe(4000)
  })

  test("does not poll in any other state", () => {
    const poll = createSummaryPoll(clock().now)

    for (const status of ["none", "ready", "failed", undefined] as const) {
      expect(poll("n1", status)).toBe(false)
    }
  })

  test("stops two minutes after the first poll started", () => {
    const time = clock()
    const poll = createSummaryPoll(time.now)

    expect(poll("n1", "building")).toBe(4000)
    time.advance(SUMMARY_POLL_WINDOW_MS - 1)
    expect(poll("n1", "building")).toBe(4000)
    time.advance(1)
    expect(SUMMARY_POLL_WINDOW_MS).toBe(120_000)
    expect(poll("n1", "building")).toBe(false)
    time.advance(60_000)
    expect(poll("n1", "stale")).toBe(false)
  })

  test("starts a new window when the summary was ready in between", () => {
    const time = clock()
    const poll = createSummaryPoll(time.now)

    expect(poll("n1", "stale")).toBe(4000)
    time.advance(SUMMARY_POLL_WINDOW_MS + 1)
    expect(poll("n1", "stale")).toBe(false)
    expect(poll("n1", "ready")).toBe(false)
    expect(poll("n1", "stale")).toBe(4000)
  })

  test("a different notebook gets its own window", () => {
    const time = clock()
    const poll = createSummaryPoll(time.now)

    expect(poll("n1", "building")).toBe(4000)
    time.advance(SUMMARY_POLL_WINDOW_MS + 1)
    expect(poll("n1", "building")).toBe(false)
    expect(poll("n2", "building")).toBe(4000)
  })
})
