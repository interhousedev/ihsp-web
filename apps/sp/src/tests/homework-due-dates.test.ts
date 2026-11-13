/** HW-DATE: the date view groups homework by due date and marks days on the week strip. */
import { describe, expect, test } from "bun:test"
import type { HomeworkItem } from "@ihsp/api"
import { homeworkItems } from "@ihsp/test-utils"
import { dayMarks, groupByDueDate } from "../features/homework/utils/group-by-due-date"
import { nextStudyDay, todayIsOver } from "../features/today/utils/next-study-day"

const base = homeworkItems[0] as HomeworkItem
const item = (over: Partial<HomeworkItem>): HomeworkItem => ({ ...base, done_at: null, days_overdue: 0, ...over })

describe("HW-DATE-1: grouping by due date", () => {
  test("groups by date, earliest first, and skips items without a date", () => {
    const days = groupByDueDate([
      item({ lesson_id: "a", due_date: "2026-10-09" }),
      item({ lesson_id: "b", due_date: "2026-10-08" }),
      item({ lesson_id: "c", due_date: "2026-10-09" }),
      item({ lesson_id: "d", due_date: null }),
    ])
    expect(days.map((day) => [day.date, day.items.map((i) => i.lesson_id)])).toEqual([
      ["2026-10-08", ["b"]],
      ["2026-10-09", ["a", "c"]],
    ])
  })

  test("a day with open overdue work gets an error mark, others a plain mark; done work is not overdue", () => {
    const days = groupByDueDate([
      item({ due_date: "2026-10-05", days_overdue: 2 }),
      item({ due_date: "2026-10-06", days_overdue: 1, done_at: "2026-10-06T08:00:00Z" }),
      item({ due_date: "2026-10-08" }),
    ])
    expect([...dayMarks(days)]).toEqual([
      ["2026-10-05", "error"],
      ["2026-10-06", "primary"],
      ["2026-10-08", "primary"],
    ])
  })
})

describe("TODAY-NEXT-1: the next study day", () => {
  test("the server's day wins; without it the next weekday is used", () => {
    expect(nextStudyDay("2026-11-16", "2026-11-14")).toBe("2026-11-16")
    expect(nextStudyDay(null, "2026-11-13")).toBe("2026-11-16")
    expect(nextStudyDay(null, "2026-11-11")).toBe("2026-11-12")
  })

  test("today is over with no lessons or only done and cancelled ones", () => {
    expect(todayIsOver([])).toBe(true)
    expect(todayIsOver([{ state: "done" }, { state: "cancelled" }])).toBe(true)
    expect(todayIsOver([{ state: "done" }, { state: "later" }])).toBe(false)
  })
})
