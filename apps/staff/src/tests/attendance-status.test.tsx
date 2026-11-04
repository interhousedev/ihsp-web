/** UF-STF-07: the shared attendance status (tick, "нб") and the draft-only "Mark all present" of a lesson. */
import { describe, expect, test } from "bun:test"
import type { AttendanceSheet, StaffLesson } from "@ihsp/api"
import { attendanceSheet, ids, server, staffLessonFor, apiUrl } from "@ihsp/test-utils"
import { AttendanceStatus, AttendanceSheetView } from "@ihsp/features-core"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { configureTests, renderStaff } from "./helpers"

configureTests()

const lessonData = staffLessonFor(ids.lessonPhysicsToday) as StaffLesson

describe("AttendanceStatus", () => {
  test("present shows a tick with the accessible label Present", () => {
    renderStaff(<AttendanceStatus state="present" />)

    expect(screen.getByRole("img", { name: "Present" })).toBeInTheDocument()
  })

  test("an absence shows the label нб in every language", () => {
    renderStaff(<AttendanceStatus state="absent" />)

    expect(screen.getByTitle("Absent")).toHaveTextContent("нб")
    expect(screen.queryByRole("img", { name: "Present" })).not.toBeInTheDocument()
  })

  test("a lesson whose attendance is not taken never shows present", () => {
    renderStaff(<AttendanceStatus state="present" notTaken />)

    expect(screen.queryByRole("img", { name: "Present" })).not.toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Attendance was not taken for this lesson." })).toHaveTextContent("–")
  })
})

describe("Mark all present", () => {
  test("fills the draft with everyone present and submits nothing by itself", async () => {
    const puts: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/staff/lessons/:id/attendance"), async ({ request }) => {
        puts.push(await request.json())
        return HttpResponse.json(attendanceSheet)
      }),
    )
    const sheet: AttendanceSheet = { ...attendanceSheet, submitted: false }
    const { user } = renderStaff(<AttendanceSheetView lesson={lessonData.lesson} sheet={sheet} startAllPresent />)

    const radios = await screen.findByRole("radiogroup", { name: /Ismoilov Jasur/ })
    expect(within(radios).getByRole("radio", { name: "Present" })).toBeChecked()
    expect(screen.getByRole("button", { name: "Submit attendance" })).toBeEnabled()
    expect(puts).toEqual([])

    await user.click(screen.getByRole("button", { name: "Mark all present" }))
    expect(puts).toEqual([])
  })
})
