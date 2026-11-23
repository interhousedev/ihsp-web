import { describe, expect, it } from "bun:test"
import {
  daysLeft,
  fraction,
  isoWeekday,
  levelFromXp,
  newQuest,
  percent,
  questProblems,
  snapThreshold,
  tashkentToday,
  xpForLevel,
} from "./engagement"

describe("levels", () => {
  it("follows 50 * L * (L - 1)", () => {
    expect([1, 2, 3, 4].map(xpForLevel)).toEqual([0, 100, 300, 600])
  })
  it("derives the level and progress from XP", () => {
    expect(levelFromXp(0)).toEqual({ level: 1, into: 0, span: 100 })
    expect(levelFromXp(99)).toEqual({ level: 1, into: 99, span: 100 })
    expect(levelFromXp(100)).toEqual({ level: 2, into: 0, span: 200 })
    expect(levelFromXp(450)).toEqual({ level: 3, into: 150, span: 300 })
    expect(levelFromXp(-5).level).toBe(1)
  })
})

describe("fractions", () => {
  it("clamps and survives an empty whole", () => {
    expect(fraction(5, 0)).toBe(0)
    expect(fraction(15, 10)).toBe(1)
    expect(percent(1, 3)).toBe(33)
  })
})

describe("dates", () => {
  it("counts days left", () => {
    expect(daysLeft("2026-11-27", "2026-11-23")).toBe(4)
    expect(daysLeft("2026-11-20", "2026-11-23")).toBe(-3)
  })
  it("uses Tashkent for today", () => {
    expect(tashkentToday(new Date("2026-11-23T20:00:00Z"))).toBe("2026-11-24")
  })
  it("numbers weekdays from Monday", () => {
    expect(isoWeekday("2026-11-23")).toBe(1)
    expect(isoWeekday("2026-11-29")).toBe(7)
  })
})

describe("threshold", () => {
  it("snaps to the 50..100 range in steps of 5", () => {
    expect(snapThreshold(83)).toBe(85)
    expect(snapThreshold(10)).toBe(50)
    expect(snapThreshold(120)).toBe(100)
  })
})

describe("quests", () => {
  it("accepts a filled quest", () => {
    expect(questProblems({ ...newQuest("2026-11-23"), title: "Week" })).toEqual([])
    expect(newQuest("2026-11-23").ends_on).toBe("2026-11-30")
  })
  it("reports every problem", () => {
    expect(
      questProblems({
        title: " ",
        goal_kind: "xp",
        target: 0,
        class_target: 1.5,
        starts_on: "2026-11-30",
        ends_on: "2026-11-23",
      }),
    ).toEqual(["title", "target", "classTarget", "dates"])
  })
})
