/** STF-8, ACA-2, ACA-11, UF-STF-06: the attendance sheet of a lesson. */
import { describe, expect, test } from "bun:test"
import type { AttendanceSheet, StaffLesson } from "@ihsp/api"
import {
  apiUrl,
  attendanceSheet,
  attendanceSheetClosed,
  errorHandlers,
  ids,
  server,
  staffLessonFor,
} from "@ihsp/test-utils"
import {
  AttendanceSheetView,
  buildSubmitBody,
  conflictingSheet,
  everyonePresent,
  initialMarks,
  rosterSections,
  useStaffLesson,
  type SheetRosterItem,
} from "@ihsp/features-core"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { configureTests, renderStaff } from "./helpers"

configureTests()

const lessonData = staffLessonFor(ids.lessonPhysicsToday) as StaffLesson

/** Loads the lesson the way the lesson page does, so a saved sheet goes through the query cache. */
function Harness() {
  const query = useStaffLesson(ids.lessonPhysicsToday)
  return query.data ? <AttendanceSheetView lesson={query.data.lesson} sheet={query.data.attendance} /> : null
}

function savedSheet(absent: string[], version: number): AttendanceSheet {
  return {
    ...attendanceSheet,
    submitted: true,
    version,
    roster: attendanceSheet.roster.map((item) => ({ ...item, absent: absent.includes(item.user_id) })),
    submitted_at: "2026-10-07T05:10:00Z",
    submitted_by: lessonData.lesson.teacher,
  }
}

function captureSubmit(): { bodies: unknown[] } {
  const captured: { bodies: unknown[] } = { bodies: [] }
  server.use(
    http.put(apiUrl("/v1/staff/lessons/:id/attendance"), async ({ request }) => {
      const body = (await request.json()) as { absent: string[]; base_version: number }
      captured.bodies.push(body)
      return HttpResponse.json(savedSheet(body.absent, body.base_version + 1))
    }),
  )
  return captured
}

describe("attendance sheet", () => {
  test("everyone starts present; tapping a student and submitting sends absent and base_version", async () => {
    const captured = captureSubmit()
    const { user } = renderStaff(<Harness />)

    const row = await screen.findByRole("button", { name: /Ismoilov Jasur/ })
    expect(row).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByText(/^Absent: 0 of 3/)).toBeInTheDocument()

    await user.click(row)
    expect(row).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText(/^Absent: 1 of 3/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Submit attendance" }))

    await waitFor(() =>
      expect(captured.bodies).toEqual([{ absent: [ids.student2], present_unassigned: [], base_version: 3 }]),
    )
    expect(await screen.findByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  test("students without a subgroup are listed separately and count only when marked", async () => {
    const captured = captureSubmit()
    const { user } = renderStaff(<Harness />)

    expect(await screen.findByText("Students without a subgroup")).toBeInTheDocument()
    const unassigned = screen.getByRole("listitem", { name: "Qodirov Sardor" })
    expect(screen.getByText(/1 student not counted/)).toBeInTheDocument()

    await user.click(within(unassigned).getByRole("button", { name: "Present" }))
    expect(within(unassigned).getByRole("button", { name: "Present" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByText(/not counted/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Submit attendance" }))

    await waitFor(() =>
      expect(captured.bodies).toEqual([{ absent: [], present_unassigned: [ids.student4], base_version: 3 }]),
    )
  })

  test("a student without a subgroup who is not marked is not sent at all", async () => {
    const captured = captureSubmit()
    const { user } = renderStaff(<Harness />)

    await user.click(await screen.findByRole("button", { name: "Submit attendance" }))

    await waitFor(() => expect(captured.bodies).toEqual([{ absent: [], present_unassigned: [], base_version: 3 }]))
  })

  test("a student the backend counted (counted flag) is a normal row", async () => {
    const roster: SheetRosterItem[] = attendanceSheet.roster.map((item) =>
      item.user_id === ids.student4 ? { ...item, counted: true } : item,
    )
    renderStaff(<AttendanceSheetView lesson={lessonData.lesson} sheet={{ ...attendanceSheet, roster }} />)

    expect(await screen.findByRole("button", { name: /Qodirov Sardor/ })).toHaveAttribute("aria-pressed", "false")
    expect(screen.queryByText("Students without a subgroup")).not.toBeInTheDocument()
    expect(screen.getByText(/^Absent: 0 of 4/)).toBeInTheDocument()
  })

  test("a 409 shows the conflict dialog with the current list; keeping my marks submits against the new version", async () => {
    const { user } = renderStaff(<Harness />)
    const row = await screen.findByRole("button", { name: /Ismoilov Jasur/ })
    await user.click(row)
    server.use(errorHandlers.conflictAttendance)

    await user.click(screen.getByRole("button", { name: "Submit attendance" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("The list was changed")).toBeInTheDocument()
    expect(within(dialog).getByText("Nobody is absent.")).toBeInTheDocument()

    const captured = captureSubmit()
    await user.click(within(dialog).getByRole("button", { name: "Keep my marks" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByRole("button", { name: /Ismoilov Jasur/ })).toHaveAttribute("aria-pressed", "true")

    await user.click(screen.getByRole("button", { name: "Submit attendance" }))

    await waitFor(() =>
      expect(captured.bodies).toEqual([{ absent: [ids.student2], present_unassigned: [], base_version: 4 }]),
    )
  })

  test("a 409 lets the teacher review the current list instead", async () => {
    const { user } = renderStaff(<Harness />)
    await user.click(await screen.findByRole("button", { name: /Ismoilov Jasur/ }))
    server.use(errorHandlers.conflictAttendance)

    await user.click(screen.getByRole("button", { name: "Submit attendance" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Show the current list" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByRole("button", { name: /Ismoilov Jasur/ })).toHaveAttribute("aria-pressed", "false")
  })

  test("the sheet is read-only after the 7-day window", async () => {
    renderStaff(
      <AttendanceSheetView lesson={{ ...lessonData.lesson, date: "2026-09-20" }} sheet={attendanceSheetClosed} />,
    )

    expect(await screen.findByText(/7-day window has passed/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Ismoilov Jasur/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Submit attendance" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Everyone present" })).not.toBeInTheDocument()
    expect(screen.getByText("Ismoilov Jasur").closest("li")).toHaveAttribute("data-absent", "true")
  })

  test("the window closing while the page is open shows the server message", async () => {
    server.use(errorHandlers.attendanceWindowClosed)
    const { user } = renderStaff(<Harness />)

    await user.click(await screen.findByRole("button", { name: "Submit attendance" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("The time to change this attendance list has passed.")
  })

  test("a cancelled lesson cannot be marked", async () => {
    renderStaff(<AttendanceSheetView lesson={{ ...lessonData.lesson, status: "cancelled" }} sheet={attendanceSheet} />)

    expect(await screen.findByText(/lesson was cancelled/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Submit attendance" })).not.toBeInTheDocument()
  })

  test("Everyone present clears the absences", async () => {
    const { user } = renderStaff(<AttendanceSheetView lesson={lessonData.lesson} sheet={attendanceSheet} />)
    await user.click(await screen.findByRole("button", { name: /Ismoilov Jasur/ }))
    expect(screen.getByRole("button", { name: /Ismoilov Jasur/ })).toHaveAttribute("aria-pressed", "true")

    await user.click(screen.getByRole("button", { name: "Everyone present" }))

    expect(screen.getByRole("button", { name: /Ismoilov Jasur/ })).toHaveAttribute("aria-pressed", "false")
  })
})

function conflict(params: Record<string, unknown>): Error {
  return Object.assign(new Error("conflict"), { name: "ApiError", type: "common/conflict", status: 409, params })
}

describe("attendance marks", () => {
  test("a saved sheet starts with its absences; unassigned students start unmarked", () => {
    const marks = initialMarks(attendanceSheet)
    expect(marks[ids.student]).toBe("present")
    expect(marks[ids.student4]).toBe("none")
    const saved = initialMarks(savedSheet([ids.student2], 4))
    expect(saved[ids.student2]).toBe("absent")
  })

  test("the body lists the absent students and the present students without a subgroup", () => {
    const marks = {
      ...initialMarks(attendanceSheet),
      [ids.student3]: "absent" as const,
      [ids.student4]: "present" as const,
    }
    expect(buildSubmitBody(marks, attendanceSheet, 7)).toEqual({
      absent: [ids.student3],
      present_unassigned: [ids.student4],
      base_version: 7,
    })
  })

  test("sections: one per group for merged lessons, the uncounted students last", () => {
    const merged: AttendanceSheet = {
      ...attendanceSheet,
      roster: [
        ...attendanceSheet.roster.slice(0, 2),
        { ...(attendanceSheet.roster[2] as SheetRosterItem), group_name: "2TN1" },
        ...attendanceSheet.roster.slice(3),
      ],
    }
    const sections = rosterSections(merged)
    expect(sections.map((section) => section.heading)).toEqual(["2TN2", "2TN1", null])
    expect(sections.at(-1)?.uncounted).toBe(true)
    expect(rosterSections(attendanceSheet).map((section) => section.heading)).toEqual([null, null])
  })

  test("Everyone present keeps a marked-present student without a subgroup", () => {
    const marks = {
      ...initialMarks(attendanceSheet),
      [ids.student4]: "present" as const,
      [ids.student2]: "absent" as const,
    }
    const next = everyonePresent(marks, attendanceSheet)
    expect(next[ids.student2]).toBe("present")
    expect(next[ids.student4]).toBe("present")
  })

  test("the conflict sheet is read from theirs or current", () => {
    expect(conflictingSheet(conflict({ theirs: attendanceSheet }))?.version).toBe(3)
    expect(conflictingSheet(conflict({ current: attendanceSheet, version: 3 }))?.version).toBe(3)
    expect(conflictingSheet(conflict({}))).toBeNull()
  })
})
