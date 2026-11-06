import type { LessonItem } from "@ihsp/api"
import { describe, expect, test } from "bun:test"
import { periodsOf } from "./week"

function lesson(period: number, date: string, start: string, end: string): LessonItem {
  return { period, date, starts_at: `${date}T${start}:00Z`, ends_at: `${date}T${end}:00Z` } as LessonItem
}

describe("periodsOf", () => {
  test("a Friday with its own period 2 does not give the row one time", () => {
    const periods = periodsOf([
      lesson(1, "2026-11-05", "03:30", "04:15"),
      lesson(1, "2026-11-06", "03:30", "04:15"),
      lesson(2, "2026-11-05", "04:25", "05:10"),
      lesson(2, "2026-11-06", "04:50", "05:30"),
    ])

    expect(periods.map((period) => [period.period, period.sameTime])).toEqual([
      [1, true],
      [2, false],
    ])
  })
})
