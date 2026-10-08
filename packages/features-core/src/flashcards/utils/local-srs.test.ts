import { describe, expect, it } from "bun:test"
import { NEW_SRS, answerCard, formatDelay, previewIntervals } from "./local-srs"

const NOW = Date.UTC(2026, 9, 7, 5, 0)
const MINUTE = 60_000
const DAY = 86_400_000

describe("answerCard (the same scheduler as backend/app/shared/srs.py)", () => {
  it("moves a new card through the learning steps of 1 and 10 minutes", () => {
    const again = answerCard(NEW_SRS, "again", NOW)
    const hard = answerCard(NEW_SRS, "hard", NOW)
    const good = answerCard(NEW_SRS, "medium", NOW)

    expect([again.state, again.step, again.dueAt]).toEqual(["learning", 0, NOW + MINUTE])
    expect([hard.state, hard.step, hard.dueAt]).toEqual(["learning", 0, NOW + MINUTE])
    expect([good.state, good.step, good.dueAt]).toEqual(["learning", 1, NOW + 10 * MINUTE])
  })

  it("graduates with Easy to 4 days and after the last step to 1 day", () => {
    const easy = answerCard(NEW_SRS, "easy", NOW)
    const graduated = answerCard(answerCard(NEW_SRS, "medium", NOW), "medium", NOW)

    expect([easy.state, easy.intervalDays, easy.dueAt]).toEqual(["review", 4, NOW + 4 * DAY])
    expect([graduated.state, graduated.intervalDays, graduated.dueAt]).toEqual(["review", 1, NOW + DAY])
  })

  it("grows a review interval by the ease and lapses on Again", () => {
    const review = { state: "review", step: 0, dueAt: NOW, intervalDays: 4, ease: 2.5 } as const

    const good = answerCard(review, "medium", NOW)
    const lapse = answerCard(review, "again", NOW)

    expect(good.intervalDays).toBeCloseTo(10)
    expect([lapse.state, lapse.dueAt]).toEqual(["relearning", NOW + 10 * MINUTE])
    expect(lapse.ease).toBeCloseTo(2.3)
    expect(lapse.intervalDays).toBe(2)
  })
})

describe("previewIntervals", () => {
  it("labels a new card like the backend: 1m, 1m, 10m, 4d", () => {
    expect(previewIntervals(NEW_SRS, NOW)).toEqual({ again: "1m", hard: "1m", medium: "10m", easy: "4d" })
  })

  it("labels a card in its second learning step: 1m, 10m, 1d, 4d", () => {
    const second = answerCard(NEW_SRS, "medium", NOW)

    expect(previewIntervals(second, NOW)).toEqual({ again: "1m", hard: "10m", medium: "1d", easy: "4d" })
  })
})

describe("formatDelay", () => {
  it("rounds down to minutes, hours, days and months", () => {
    expect(formatDelay(30_000)).toBe("1m")
    expect(formatDelay(10 * MINUTE)).toBe("10m")
    expect(formatDelay(5 * 3_600_000)).toBe("5h")
    expect(formatDelay(4 * DAY)).toBe("4d")
    expect(formatDelay(65 * DAY)).toBe("2mo")
  })
})
