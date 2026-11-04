/** The seminar_soon alert: its params become the subject, the start time and the period of the copy. */
import { describe, expect, test } from "bun:test"
import type { Alert } from "@ihsp/api"
import { seminarAlertParams } from "../features/today/utils/alert-text"

const starts = "2026-10-07T10:00:00+05:00"

describe("seminar_soon alert", () => {
  test("reads the subject, the start time and the period from the alert", () => {
    const alert: Alert = {
      kind: "seminar_soon",
      params: { subject_name: "Physics", starts_at: starts, period: 3 },
      action_url: "/timetable/",
    }
    const params = seminarAlertParams(alert)
    expect(params.subject).toBe("Physics")
    expect(params.period).toBe(3)
    expect(params.time).toMatch(/10:00/)
  })

  test("a missing param is an empty value, never an invented subject or time", () => {
    const alert: Alert = { kind: "seminar_soon", params: {}, action_url: "/timetable/" }
    const params = seminarAlertParams(alert)
    expect(params.subject).toBe("")
    expect(params.time).toBe("")
    expect(params.period).toBe(0)
  })
})
