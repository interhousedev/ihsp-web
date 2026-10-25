/** WO-3, UF-STF-06: work-off tasks on the attendance sheet of a lesson. */
import { describe, expect, test } from "bun:test"
import type { StaffLesson, WorkOffItem } from "@ihsp/api"
import { AttendanceSheetView, useStaffLesson } from "@ihsp/features-core"
import {
  apiUrl,
  attendanceSheet,
  ids,
  makeWorkOff,
  seedStaffWorkOffs,
  server,
  staffLessonFor,
  staffWorkOffsOf,
  workOffTemplateIds,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { configureTests, renderStaff } from "./helpers"

configureTests()

const lessonData = staffLessonFor(ids.lessonPhysicsToday) as StaffLesson
const DEFAULT_TEXT = "Solve problems 1-5 from the textbook"

function Harness() {
  const query = useStaffLesson(ids.lessonPhysicsToday)
  return query.data ? <AttendanceSheetView lesson={query.data.lesson} sheet={query.data.attendance} /> : null
}

type Body = Record<string, unknown>

/** Captures the submitted bodies and answers with a saved sheet. */
function captureSubmit(): Body[] {
  const bodies: Body[] = []
  server.use(
    http.put(apiUrl("/v1/staff/lessons/:id/attendance"), async ({ request }) => {
      const body = (await request.json()) as Body & { absent: string[]; base_version: number }
      bodies.push(body)
      return HttpResponse.json({
        ...attendanceSheet,
        submitted: true,
        version: body.base_version + 1,
        roster: attendanceSheet.roster.map((item) => ({ ...item, absent: body.absent.includes(item.user_id) })),
        work_offs: [],
        submitted_at: "2026-10-07T05:10:00Z",
        submitted_by: lessonData.lesson.teacher,
      })
    }),
  )
  return bodies
}

/** The lesson as saved with Ismoilov Jasur absent and the given work-off. */
function savedAbsence(workOff: WorkOffItem) {
  seedStaffWorkOffs([workOff])
  server.use(
    http.get(apiUrl("/v1/staff/lessons/:id"), () =>
      HttpResponse.json({
        ...lessonData,
        attendance: {
          ...attendanceSheet,
          submitted: true,
          version: 4,
          roster: attendanceSheet.roster.map((item) => ({ ...item, absent: item.user_id === ids.student2 })),
          work_offs: staffWorkOffsOf(ids.lessonPhysicsToday),
          submitted_at: "2026-10-07T05:10:00Z",
          submitted_by: lessonData.lesson.teacher,
        },
      }),
    ),
  )
}

function absentRadio(name: RegExp) {
  return within(screen.getByRole("radiogroup", { name })).getByRole("radio", { name: "Absent" })
}

async function openDialogFor(user: ReturnType<typeof renderStaff>["user"], student: RegExp) {
  await screen.findByRole("radiogroup", { name: student })
  await user.click(absentRadio(student))
  const dialog = await screen.findByRole("dialog")
  await within(dialog).findByRole("radio", { name: DEFAULT_TEXT })
  return dialog
}

describe("work-off tasks on the attendance sheet", () => {
  test("marking a student absent opens the dialog with the default template preselected", async () => {
    const { user } = renderStaff(<Harness />)

    const dialog = await openDialogFor(user, /Ismoilov Jasur/)

    expect(within(dialog).getByRole("heading", { name: "Work-off task: Ismoilov Jasur" })).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getByRole("radio", { name: DEFAULT_TEXT })).toBeChecked())
    expect(within(dialog).getByRole("radio", { name: "None" })).not.toBeChecked()
    expect(within(dialog).getByRole("textbox", { name: "Extra text" })).toBeInTheDocument()
  })

  test("the chosen template and extra text are shown on the row and sent with Save", async () => {
    const bodies = captureSubmit()
    const { user } = renderStaff(<Harness />)

    const dialog = await openDialogFor(user, /Ismoilov Jasur/)
    await user.type(within(dialog).getByRole("textbox", { name: "Extra text" }), "Bring the notebook")
    await user.click(within(dialog).getByRole("button", { name: "Apply" }))

    const row = screen.getByRole("listitem", { name: "Ismoilov Jasur" })
    expect(within(row).getByText(/Work-off: Solve problems 1-5 from the textbook/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Submit attendance" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          absent: [ids.student2],
          late: [],
          present_unassigned: [],
          base_version: 3,
          work_offs: [
            {
              student_id: ids.student2,
              template_id: workOffTemplateIds.default,
              text: "Bring the notebook",
              due_date: null,
            },
          ],
        },
      ]),
    )
  })

  test("choosing None sends no work-off entry for a student without a saved one", async () => {
    const bodies = captureSubmit()
    const { user } = renderStaff(<Harness />)

    const dialog = await openDialogFor(user, /Ismoilov Jasur/)
    await user.click(within(dialog).getByRole("radio", { name: "None" }))
    await user.click(within(dialog).getByRole("button", { name: "Apply" }))
    expect(
      within(screen.getByRole("listitem", { name: "Ismoilov Jasur" })).getByText("No work-off task"),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Submit attendance" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ absent: [ids.student2], late: [], present_unassigned: [], base_version: 3 })
  })

  test("the row edit button reopens the dialog with the choice", async () => {
    const { user } = renderStaff(<Harness />)
    const dialog = await openDialogFor(user, /Ismoilov Jasur/)
    await user.type(within(dialog).getByRole("textbox", { name: "Extra text" }), "Page 4")
    await user.click(within(dialog).getByRole("button", { name: "Apply" }))

    await user.click(screen.getByRole("button", { name: "Edit the work-off task of Ismoilov Jasur" }))

    const again = await screen.findByRole("dialog")
    expect(within(again).getByRole("textbox", { name: "Extra text" })).toHaveValue("Page 4")
  })

  test("switching the student back to present drops the pending choice", async () => {
    const bodies = captureSubmit()
    const { user } = renderStaff(<Harness />)
    const dialog = await openDialogFor(user, /Ismoilov Jasur/)
    await user.click(within(dialog).getByRole("button", { name: "Apply" }))

    await user.click(
      within(screen.getByRole("radiogroup", { name: /Ismoilov Jasur/ })).getByRole("radio", { name: "Present" }),
    )

    expect(screen.queryByText(/Work-off: /)).not.toBeInTheDocument()
    await user.click(absentRadio(/Ismoilov Jasur/))
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel" }))
    await user.click(screen.getByRole("button", { name: "Submit attendance" }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).not.toHaveProperty("work_offs")
  })

  test("Save without work-off tasks sends the mode none", async () => {
    const bodies = captureSubmit()
    const { user } = renderStaff(<Harness />)
    const dialog = await openDialogFor(user, /Ismoilov Jasur/)
    await user.click(within(dialog).getByRole("button", { name: "Apply" }))

    await user.click(screen.getByRole("button", { name: "Save without work-off tasks" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        { absent: [ids.student2], late: [], present_unassigned: [], base_version: 3, work_off_mode: "none" },
      ]),
    )
  })

  test("the common option is off while nobody is absent", async () => {
    renderStaff(<Harness />)

    expect(await screen.findByRole("button", { name: "Save and give one common task to all absent" })).toBeDisabled()
  })

  test("a common work-off task goes to all absent students in mode common", async () => {
    const bodies = captureSubmit()
    const { user } = renderStaff(<Harness />)
    const dialog = await openDialogFor(user, /Ismoilov Jasur/)
    await user.click(within(dialog).getByRole("button", { name: "Apply" }))

    await user.click(screen.getByRole("button", { name: "Save and give one common task to all absent" }))
    const common = await screen.findByRole("dialog")
    expect(within(common).getByRole("heading", { name: "Work-off task for all absent students" })).toBeInTheDocument()
    await within(common).findByRole("radio", { name: DEFAULT_TEXT })
    await user.click(within(common).getByRole("radio", { name: "Write a short summary of the topic" }))
    await user.type(within(common).getByRole("textbox", { name: "Extra text" }), "By Friday")
    await user.click(within(common).getByRole("button", { name: "Apply" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          absent: [ids.student2],
          late: [],
          present_unassigned: [],
          base_version: 3,
          work_off_mode: "common",
          common_work_off: { template_id: workOffTemplateIds.second, text: "By Friday", due_date: null },
        },
      ]),
    )
  })

  test("a common work-off needs a template or a text", async () => {
    const { user } = renderStaff(<Harness />)
    const dialog = await openDialogFor(user, /Ismoilov Jasur/)
    await user.click(within(dialog).getByRole("button", { name: "Apply" }))

    await user.click(screen.getByRole("button", { name: "Save and give one common task to all absent" }))
    const common = await screen.findByRole("dialog")
    await within(common).findByRole("radio", { name: DEFAULT_TEXT })
    await user.click(within(common).getByRole("radio", { name: "None" }))

    expect(within(common).getByRole("button", { name: "Apply" })).toBeDisabled()
  })
})

describe("saved work-off tasks on the rows", () => {
  test("a saved work-off shows on the absent student's row and can be marked done and reopened", async () => {
    const patches: unknown[] = []
    savedAbsence(makeWorkOff(ids.lessonPhysicsToday))
    server.events.on("request:start", async ({ request }) => {
      if (request.method === "PATCH") patches.push(await request.clone().json())
    })
    const { user } = renderStaff(<Harness />)

    const row = await screen.findByRole("listitem", { name: "Ismoilov Jasur" })
    expect(within(row).getByText(/Work-off: Solve problems 1-5/)).toBeInTheDocument()
    await user.click(within(row).getByRole("button", { name: "Mark done" }))

    expect(await within(row).findByRole("button", { name: "Reopen" })).toBeInTheDocument()
    expect(within(row).getByText("Done")).toBeInTheDocument()
    await user.click(within(row).getByRole("button", { name: "Reopen" }))

    expect(await within(row).findByRole("button", { name: "Mark done" })).toBeInTheDocument()
    expect(patches).toEqual([{ status: "done" }, { status: "assigned" }])
  })

  test("editing the saved work-off patches its text and due date", async () => {
    const patches: unknown[] = []
    savedAbsence(makeWorkOff(ids.lessonPhysicsToday))
    server.events.on("request:start", async ({ request }) => {
      if (request.method === "PATCH") patches.push(await request.clone().json())
    })
    const { user } = renderStaff(<Harness />)

    await user.click(await screen.findByRole("button", { name: "Edit the work-off task of Ismoilov Jasur" }))
    const dialog = await screen.findByRole("dialog")
    const field = within(dialog).getByRole("textbox", { name: "Task" })
    await user.clear(field)
    await user.type(field, "Redo the lab report")
    await user.click(within(dialog).getByRole("button", { name: "Clear the due date" }))
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(patches).toEqual([{ text: "Redo the lab report", due_date: null }]))
    expect(
      await within(screen.getByRole("listitem", { name: "Ismoilov Jasur" })).findByText(
        /Work-off: Redo the lab report/,
      ),
    ).toBeInTheDocument()
  })

  test("deleting the saved work-off asks first and then removes it from the row", async () => {
    savedAbsence(makeWorkOff(ids.lessonPhysicsToday))
    const { user } = renderStaff(<Harness />)

    await user.click(await screen.findByRole("button", { name: "Delete the work-off task of Ismoilov Jasur" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(screen.queryByText(/Work-off: /)).not.toBeInTheDocument())
    expect(staffWorkOffsOf(ids.lessonPhysicsToday)).toEqual([])
  })

  test("choosing None again for a student with a saved work-off sends an empty entry to remove it", async () => {
    const bodies = captureSubmit()
    savedAbsence(makeWorkOff(ids.lessonPhysicsToday))
    const { user } = renderStaff(<Harness />)
    await screen.findByText(/Work-off: Solve problems/)

    const row = screen.getByRole("listitem", { name: "Ismoilov Jasur" })
    await user.click(within(row).getByRole("radio", { name: "Present" }))
    await user.click(within(row).getByRole("radio", { name: "Absent" }))
    const dialog = await screen.findByRole("dialog")
    await within(dialog).findByRole("radio", { name: DEFAULT_TEXT })
    await user.click(within(dialog).getByRole("radio", { name: "None" }))
    await user.click(within(dialog).getByRole("button", { name: "Apply" }))
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          absent: [ids.student2],
          late: [],
          present_unassigned: [],
          base_version: 4,
          work_offs: [{ student_id: ids.student2, template_id: null, text: null, due_date: null }],
        },
      ]),
    )
  })
})
