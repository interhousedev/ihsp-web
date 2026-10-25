/** WEB-17: the old attendance address replaces itself with the calendar. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { setTestRoute, testRouter } from "@ihsp/test-utils"
import { render, waitFor } from "@testing-library/react"
import { AttendanceRedirect } from "../features/attendance/components/attendance-redirect"
import { configureTests } from "./helpers"

configureTests()

beforeEach(() => setTestRoute("/"))
afterEach(() => setTestRoute("/"))

describe("the old attendance address", () => {
  test("replaces itself with the calendar's month view", async () => {
    setTestRoute("/attendance/")
    render(<AttendanceRedirect />)

    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/timetable/?view=month"))
    expect(testRouter.push).not.toHaveBeenCalled()
  })

  test("keeps the view and the day the old address carries", async () => {
    setTestRoute("/attendance/?view=week&day=2026-10-06")
    render(<AttendanceRedirect />)

    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/timetable/?view=week&day=2026-10-06"))
  })
})
