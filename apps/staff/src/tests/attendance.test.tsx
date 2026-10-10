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

function radio(name: RegExp | string, state: "Present" | "Late" | "Absent") {
  return within(screen.getByRole("radiogroup", { name })).getByRole("radio", { name: state })
}

describe("attendance sheet", () => {
  test("everyone starts present; marking a student absent and submitting sends absent and base_version", async () => {
    const captured = captureSubmit()
    const { user } = renderStaff(<Harness />)

    await screen.findByRole("radiogroup", { name: /Ismoilov Jasur/ })
    expect(radio(/Ismoilov Jasur/, "Present")).toBeChecked()
    expect(screen.getByText(/^3 present/)).toBeInTheDocument()

    await user.click(radio(/Ismoilov Jasur/, "Absent"))
    expect(radio(/Ismoilov Jasur/, "Absent")).toBeChecked()
    expect(screen.getByText(/^2 present · 1 absent/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Submit attendance" }))

    await waitFor(() =>
      expect(captured.bodies).toEqual([{ absent: [ids.student2], late: [], present_unassigned: [], base_version: 3 }]),
    )
    expect(await screen.findByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  test("late counts as present in the summary and is sent in the late list", async () => {
    const captured = captureSubmit()
    const { user } = renderStaff(<Harness />)
    await screen.findByRole("radiogroup", { name: /Ismoilov Jasur/ })

    await user.click(screen.getByText("Ismoilov Jasur"))
    expect(radio(/Ismoilov Jasur/, "Present")).toBeChecked()

    await user.click(radio(/Ismoilov Jasur/, "Late"))
    expect(screen.getByText(/^2 present · 1 late/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Submit attendance" }))

    await waitFor(() =>
      expect(captured.bodies).toEqual([{ absent: [], late: [ids.student2], present_unassigned: [], base_version: 3 }]),
    )
  })

  test("the arrow keys move between the states", async () => {
    const { user } = renderStaff(<Harness />)
    await screen.findByRole("radiogroup", { name: /Ismoilov Jasur/ })

    radio(/Ismoilov Jasur/, "Present").focus()
    await user.keyboard("{ArrowRight}")
    expect(radio(/Ismoilov Jasur/, "Late")).toBeChecked()
    await user.keyboard("{ArrowRight}")
    expect(radio(/Ismoilov Jasur/, "Absent")).toBeChecked()
  })

  test("students without a subgroup are listed separately and count only when marked", async () => {
    const captured = captureSubmit()
    const { user } = renderStaff(<Harness />)

    expect(await screen.findByText("Students without a subgroup")).toBeInTheDocument()
    const unassigned = screen.getByRole("listitem", { name: "Qodirov Sardor" })
    expect(screen.getByText(/1 student not counted/)).toBeInTheDocument()

    await user.click(within(unassigned).getByRole("radio", { name: "Present" }))
    expect(within(unassigned).getByRole("radio", { name: "Present" })).toBeChecked()
    expect(screen.queryByText(/not counted/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Submit attendance" }))

    await waitFor(() =>
      expect(captured.bodies).toEqual([{ absent: [], late: [], present_unassigned: [ids.student4], base_version: 3 }]),
    )
  })

  test("a student without a subgroup who is not marked is not sent at all", async () => {
    const captured = captureSubmit()
    const { user } = renderStaff(<Harness />)

    await user.click(await screen.findByRole("button", { name: "Submit attendance" }))

    await waitFor(() => expect(captured.bodies).toEqual([{ absent: [], late: [], present_unassigned: [], base_version: 3 }]))
  })

  test("a student the backend counted (counted flag) is a normal row", async () => {
    const roster: SheetRosterItem[] = attendanceSheet.roster.map((item) =>
      item.user_id === ids.student4 ? { ...item, counted: true } : item,
    )
    renderStaff(<AttendanceSheetView lesson={lessonData.lesson} sheet={{ ...attendanceSheet, roster }} />)

    await screen.findByRole("radiogroup", { name: /Qodirov Sardor/ })
    expect(radio(/Qodirov Sardor/, "Present")).toBeChecked()
    expect(screen.queryByText("Students without a subgroup")).not.toBeInTheDocument()
    expect(screen.getByText(/^4 present/)).toBeInTheDocument()
  })

  test("a 409 shows the conflict dialog with the current list; keeping my marks submits against the new version", async () => {
    const { user } = renderStaff(<Harness />)
    await screen.findByRole("radiogroup", { name: /Ismoilov Jasur/ })
    await user.click(radio(/Ismoilov Jasur/, "Absent"))
    server.use(errorHandlers.conflictAttendance)

    await user.click(screen.getByRole("button", { name: "Submit attendance" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("The list was changed")).toBeInTheDocument()
    expect(within(dialog).getByText("Nobody is absent.")).toBeInTheDocument()

    const captured = captureSubmit()
    await user.click(within(dialog).getByRole("button", { name: "Keep my marks" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(radio(/Ismoilov Jasur/, "Absent")).toBeChecked()

    await user.click(screen.getByRole("button", { name: "Submit attendance" }))

    await waitFor(() =>
      expect(captured.bodies).toEqual([{ absent: [ids.student2], late: [], present_unassigned: [], base_version: 4 }]),
    )
  })

  test("a 409 lets the teacher review the current list instead", async () => {
    const { user } = renderStaff(<Harness />)
    await screen.findByRole("radiogroup", { name: /Ismoilov Jasur/ })
    await user.click(radio(/Ismoilov Jasur/, "Absent"))
    server.use(errorHandlers.conflictAttendance)

    await user.click(screen.getByRole("button", { name: "Submit attendance" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Show the current list" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(radio(/Ismoilov Jasur/, "Present")).toBeChecked()
  })

  test("the sheet is read-only after the 7-day window", async () => {
    renderStaff(
      <AttendanceSheetView lesson={{ ...lessonData.lesson, date: "2026-09-20" }} sheet={attendanceSheetClosed} />,
    )

    expect(await screen.findByText(/7-day window has passed/)).toBeInTheDocument()
    expect(screen.queryByRole("radiogroup", { name: /Ismoilov Jasur/ })).not.toBeInTheDocument()
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
    await screen.findByRole("radiogroup", { name: /Ismoilov Jasur/ })
    await user.click(radio(/Ismoilov Jasur/, "Absent"))
    expect(radio(/Ismoilov Jasur/, "Absent")).toBeChecked()

    await user.click(screen.getByRole("button", { name: "Everyone present" }))

    expect(radio(/Ismoilov Jasur/, "Present")).toBeChecked()
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
      late: [], present_unassigned: [ids.student4],
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
