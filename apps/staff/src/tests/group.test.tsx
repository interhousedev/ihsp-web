/** STF-11 to STF-15, UF-STF-09 to UF-STF-11: My group. */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import {
  FIXTURE_TODAY,
  apiUrl,
  attendanceSheetSubmitted,
  group1TN1,
  group2TN2,
  ids,
  server,
  weekLessons,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { useNav } from "../config/nav"
import { GroupAttendancePage } from "../features/group/components/group-attendance-page"
import { ExcuseDialog } from "../features/group/components/excuse-dialog"
import { StudentsPage } from "../features/group/components/students-page"
import { SubgroupsPage } from "../features/group/components/subgroups-page"
import { reportParams } from "../features/group/utils/report-params"
import { assign, effectiveSubgroup, sortForAssignment, toBody } from "../features/group/utils/subgroups"
import { formatGpa, formatRate, sortStudents } from "../features/group/utils/students"
import { configureTests, freezeTime, renderStaff, setViewportWidth, unfreezeTime } from "./helpers"

configureTests()

beforeEach(() => {
  freezeTime()
  setViewportWidth(1280)
})
afterEach(() => {
  unfreezeTime()
  setViewportWidth(1280)
})

const pastLesson = weekLessons.find((lesson) => lesson.date < FIXTURE_TODAY && lesson.subject.id === ids.physics)
if (!pastLesson) throw new Error("fixture: no past physics lesson")

function NavTitles() {
  const nav = useNav()
  return (
    <>
      <ul aria-label="sidebar">
        {nav.groups
          .flatMap((group) => group.items)
          .map((item) => (
            <li key={item.url}>{item.title}</li>
          ))}
      </ul>
      <p data-testid="bottom">{nav.bottom.map((item) => item.title).join(",")}</p>
    </>
  )
}

describe("navigation", () => {
  test("a curator sees the My group pages", async () => {
    renderStaff(<NavTitles />)

    await waitFor(() => expect(screen.getByTestId("bottom")).toHaveTextContent("Today,Timetable,Journal,My group"))
    const sidebar = screen.getByRole("list", { name: "sidebar" })
    for (const title of [
      "Today",
      "Timetable",
      "Journal",
      "Students",
      "Subgroups",
      "Attendance",
      "Notifications",
      "Settings",
    ]) {
      expect(within(sidebar).getByText(title)).toBeInTheDocument()
    }
  })

  test("My group is hidden when the teacher curates nothing", async () => {
    let asked = 0
    server.use(
      http.get(apiUrl("/v1/staff/groups"), () => {
        asked += 1
        return HttpResponse.json([])
      }),
    )
    renderStaff(<NavTitles />)

    await waitFor(() => expect(asked).toBe(1))
    await waitFor(() => expect(screen.getByTestId("bottom")).toHaveTextContent(/^Today,Timetable,Journal$/))
    const sidebar = screen.getByRole("list", { name: "sidebar" })
    expect(within(sidebar).queryByText("Students")).not.toBeInTheDocument()
    expect(within(sidebar).queryByText("Subgroups")).not.toBeInTheDocument()
    expect(within(sidebar).getByText("Journal")).toBeInTheDocument()
  })
})

describe("students", () => {
  test("flagged students come first with the reason; the header shows the head student", async () => {
    renderStaff(<StudentsPage />)

    expect(await screen.findByText("Head student: Brastilov Aleksey")).toBeInTheDocument()
    const list = await screen.findByRole("list")
    const names = within(list)
      .getAllByRole("button")
      .map((button) => button.textContent ?? "")

    expect(names[0]).toContain("Brastilov Aleksey")
    expect(names[0]).toContain("High absences")
    expect(names[1]).toContain("GPA drop")
    expect(names[2]).toContain("No subgroup")
    expect(names[3]).toContain("Nazarova Madina")
    expect(names[3]).not.toContain("High absences")
    expect(screen.getByText("3 students need attention")).toBeInTheDocument()
  })

  test("a row shows subgroup, absence rate and GPA", async () => {
    renderStaff(<StudentsPage />)

    const row = (await screen.findByRole("button", { name: /Brastilov Aleksey/ })) as HTMLElement

    expect(row).toHaveTextContent("Subgroup 1")
    expect(row).toHaveTextContent("8%")
    expect(row).toHaveTextContent("4.10")
  })

  test("opening a student shows the card with the reasons", async () => {
    const { user } = renderStaff(<StudentsPage />)

    await user.click(await screen.findByRole("button", { name: /Qodirov Sardor/ }))

    const card = await screen.findByRole("dialog")
    expect(within(card).getByText("Qodirov Sardor")).toBeInTheDocument()
    expect(within(card).getByText("Not registered")).toBeInTheDocument()
    expect(within(card).getByText(/sees the lessons of both subgroups/)).toBeInTheDocument()
    expect(within(card).getByRole("link", { name: "Assign a subgroup" })).toBeInTheDocument()
  })

  test("a curator of several groups can pick one", async () => {
    server.use(http.get(apiUrl("/v1/staff/groups"), () => HttpResponse.json([group2TN2, group1TN1])))
    renderStaff(<StudentsPage />)

    const picker = await screen.findByRole("combobox", { name: "Group" })

    expect(
      within(picker)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["2TN2", "1TN1"])
  })

  test("a teacher who curates nothing is told so", async () => {
    server.use(http.get(apiUrl("/v1/staff/groups"), () => HttpResponse.json([])))
    renderStaff(<StudentsPage />)

    expect(await screen.findByText("You do not curate a group.")).toBeInTheDocument()
  })
})

type SavedBody = { assignments: { user_id: string; subgroup: number | null }[] }

/** Answers the subgroup save and records what was sent. */
function captureSave(): { bodies: SavedBody[] } {
  const captured: { bodies: SavedBody[] } = { bodies: [] }
  server.use(
    http.put(apiUrl("/v1/staff/groups/:id/subgroups"), async ({ request }) => {
      captured.bodies.push((await request.json()) as SavedBody)
      return HttpResponse.json({ ...group2TN2, emis_group_id: 1, students: [] })
    }),
  )
  return captured
}

describe("subgroups", () => {
  test("students without a subgroup are on top", async () => {
    renderStaff(<SubgroupsPage />)

    const first = (await screen.findAllByRole("listitem"))[0] as HTMLElement

    expect(first).toHaveTextContent("Qodirov Sardor")
    expect(within(first).getByText("Not set")).toBeInTheDocument()
  })

  test("bulk assign: select several students, choose a subgroup and save", async () => {
    const captured = captureSave()
    const { user } = renderStaff(<SubgroupsPage />)

    await user.click(await screen.findByRole("checkbox", { name: "Select Qodirov Sardor" }))
    await user.click(screen.getByRole("checkbox", { name: "Select Ismoilov Jasur" }))
    expect(screen.getByText("2 selected")).toBeInTheDocument()
    await user.click(
      within(screen.getByRole("group", { name: "Assign the selected students" })).getByRole("button", {
        name: "Subgroup 1",
      }),
    )

    expect(screen.getByText("2 unsaved changes")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(captured.bodies).toHaveLength(1))
    expect(captured.bodies[0]?.assignments).toEqual(
      expect.arrayContaining([
        { user_id: ids.student4, subgroup: 1 },
        { user_id: ids.student2, subgroup: 1 },
      ]),
    )
    expect(captured.bodies[0]?.assignments).toHaveLength(2)
  })

  test("one student at a time; only the changed students are sent", async () => {
    const captured = captureSave()
    const { user } = renderStaff(<SubgroupsPage />)

    await user.click(await screen.findByRole("button", { name: "Nazarova Madina: subgroup 2" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(captured.bodies).toEqual([{ assignments: [{ user_id: ids.student3, subgroup: 2 }] }]))
  })

  test("changing a student back removes the change; Save is off with no changes", async () => {
    const { user } = renderStaff(<SubgroupsPage />)

    const save = await screen.findByRole("button", { name: "Save" })
    expect(save).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Nazarova Madina: subgroup 2" }))
    expect(save).toBeEnabled()
    await user.click(screen.getByRole("button", { name: "Nazarova Madina: subgroup 2" }))
    await user.click(screen.getByRole("button", { name: "Nazarova Madina: subgroup 1" }))

    expect(save).toBeDisabled()
  })

  test("pending changes: helpers", () => {
    const students = [
      {
        user_id: "a",
        first_name: "A",
        last_name: "A",
        subgroup: 1 as const,
        status: "active" as const,
        registered: true,
      },
      { user_id: "b", first_name: "B", last_name: "B", subgroup: null, status: "active" as const, registered: true },
      {
        user_id: "c",
        first_name: "C",
        last_name: "C",
        subgroup: 2 as const,
        status: "left" as const,
        registered: true,
      },
    ]
    const pending = assign({}, students, ["a", "b"], 2)
    expect(pending).toEqual({ a: 2, b: 2 })
    expect(effectiveSubgroup(students[0] as (typeof students)[number], pending)).toBe(2)
    expect(assign(pending, students, ["a"], 1)).toEqual({ b: 2 })
    expect(toBody(pending)).toEqual({
      assignments: [
        { user_id: "a", subgroup: 2 },
        { user_id: "b", subgroup: 2 },
      ],
    })
    expect(sortForAssignment(students).map((student) => student.user_id)).toEqual(["b", "a"])
  })
})

describe("group attendance", () => {
  test("shows the report for the last 30 days per student, with excused absences and lessons not taken", async () => {
    const requests: URL[] = []
    server.use(
      http.get(apiUrl("/v1/staff/groups/:id/attendance"), ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json({
          view: "student",
          from: "2026-09-07",
          to: FIXTURE_TODAY,
          rows: [
            {
              key: ids.student,
              label: "Brastilov Aleksey",
              absences: 5,
              excused: 1,
              lessons: 60,
              rate: 0.08,
              not_taken: 2,
            },
          ],
        })
      }),
    )
    renderStaff(<GroupAttendancePage />, { route: "/group/attendance/" })

    const table = await screen.findByRole("table")

    expect(requests[0]?.searchParams.get("view")).toBe("student")
    expect(requests[0]?.searchParams.get("from")).toBe("2026-09-07")
    expect(requests[0]?.searchParams.get("to")).toBe(FIXTURE_TODAY)
    const row = within(table).getByText("Brastilov Aleksey").closest("tr") as HTMLElement
    expect(
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["Brastilov Aleksey", "5", "1", "60", "8%", "2"])
  })

  test("switching the view asks for it", async () => {
    const views: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/staff/groups/:id/attendance"), ({ request }) => {
        const view = new URL(request.url).searchParams.get("view")
        views.push(view)
        return HttpResponse.json({ view, from: "2026-09-07", to: FIXTURE_TODAY, rows: [] })
      }),
    )
    const { user } = renderStaff(<GroupAttendancePage />, { route: "/group/attendance/" })

    await screen.findByRole("tab", { name: "Per day" })
    await user.click(screen.getByRole("tab", { name: "Per day" }))

    await waitFor(() => expect(views).toContain("day"))
    expect(await screen.findByText("No data for this range.")).toBeInTheDocument()
  })

  test("the per-lesson view has an Excuse button that opens the excuse dialog", async () => {
    server.use(
      http.get(apiUrl("/v1/staff/groups/:id/attendance"), ({ request }) => {
        const view = new URL(request.url).searchParams.get("view")
        return HttpResponse.json({
          view,
          from: "2026-09-07",
          to: FIXTURE_TODAY,
          rows: [
            {
              key: pastLesson.id,
              label: "Physics, 5 Oct",
              absences: 1,
              excused: 0,
              lessons: 1,
              rate: 0.25,
              not_taken: 0,
            },
            { key: "no-absences", label: "Physics, 8 Oct", absences: 0, excused: 0, lessons: 1, rate: 0, not_taken: 0 },
          ],
        })
      }),
    )
    const { user } = renderStaff(<GroupAttendancePage />, { route: "/group/attendance/?view=lesson" })

    const excuse = await screen.findAllByRole("button", { name: "Excuse" })
    expect(excuse).toHaveLength(1)
    await user.click(excuse[0] as HTMLElement)

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Excuse absences")).toBeInTheDocument()
    expect(await within(dialog).findByText("Ismoilov Jasur")).toBeInTheDocument()
  })

  test("phones get cards instead of a table", async () => {
    setViewportWidth(360)
    renderStaff(<GroupAttendancePage />, { route: "/group/attendance/" })

    expect(await screen.findByText("Brastilov Aleksey")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  test("Export asks for the CSV of the current view", async () => {
    const requests: URL[] = []
    server.use(
      http.get(apiUrl("/v1/staff/groups/:id/attendance.csv"), ({ request }) => {
        requests.push(new URL(request.url))
        return new HttpResponse("a;b\n", { headers: { "Content-Type": "text/csv" } })
      }),
    )
    const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL }
    URL.createObjectURL = () => "blob:attendance"
    URL.revokeObjectURL = () => undefined
    spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
    try {
      const { user } = renderStaff(<GroupAttendancePage />, { route: "/group/attendance/?view=subject" })

      await screen.findByRole("table")
      await user.click(screen.getByRole("button", { name: "Export CSV" }))

      await waitFor(() => expect(requests).toHaveLength(1))
      expect(requests[0]?.searchParams.get("view")).toBe("subject")
    } finally {
      URL.createObjectURL = original.create
      URL.revokeObjectURL = original.revoke
    }
  })

  test("report parameters default to the last 30 days and fix a reversed range", () => {
    expect(reportParams("student", null, null)).toEqual({ view: "student", from: "2026-09-07", to: "2026-10-07" })
    expect(reportParams("day", "2026-10-05", "2026-10-01")).toEqual({
      view: "day",
      from: "2026-10-01",
      to: "2026-10-05",
    })
    expect(reportParams("lesson", "nonsense", "2026-10-07").from).toBe("2026-09-07")
  })
})

describe("excuse dialog", () => {
  test("marks an absence as excused with a comment", async () => {
    const bodies: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/staff/lessons/:id/attendance/excuse"), async ({ request }) => {
        const body = (await request.json()) as { student_id: string; comment?: string }
        bodies.push(body)
        return HttpResponse.json({
          ...attendanceSheetSubmitted,
          roster: attendanceSheetSubmitted.roster.map((item) =>
            item.user_id === body.student_id ? { ...item, excused: true, excuse_comment: body.comment ?? null } : item,
          ),
        })
      }),
    )
    const { user } = renderStaff(
      <ExcuseDialog lessonId={pastLesson.id} label="Physics, 5 Oct" onClose={() => undefined} />,
    )

    const comment = await screen.findByLabelText("Comment for Ismoilov Jasur")
    await user.type(comment, "Medical note")
    await user.click(screen.getByRole("button", { name: "Mark Ismoilov Jasur as excused" }))

    await waitFor(() => expect(bodies).toEqual([{ student_id: ids.student2, excused: true, comment: "Medical note" }]))
  })

  test("removes an excuse", async () => {
    const excused = {
      ...attendanceSheetSubmitted,
      roster: attendanceSheetSubmitted.roster.map((item) =>
        item.absent ? { ...item, excused: true, excuse_comment: "Flu" } : item,
      ),
    }
    server.use(
      http.get(apiUrl("/v1/staff/lessons/:id"), () =>
        HttpResponse.json({
          lesson: pastLesson,
          materials: [],
          attachments: [],
          homework: null,
          attendance: excused,
        }),
      ),
    )
    const bodies: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/staff/lessons/:id/attendance/excuse"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(attendanceSheetSubmitted)
      }),
    )
    const { user } = renderStaff(
      <ExcuseDialog lessonId={pastLesson.id} label="Physics, 5 Oct" onClose={() => undefined} />,
    )

    await user.click(await screen.findByRole("button", { name: "Remove excuse" }))

    await waitFor(() => expect(bodies).toEqual([{ student_id: ids.student2, excused: false }]))
  })

  test("a lesson nobody missed says so", async () => {
    server.use(
      http.get(apiUrl("/v1/staff/lessons/:id"), () =>
        HttpResponse.json({
          lesson: pastLesson,
          materials: [],
          attachments: [],
          homework: null,
          attendance: {
            ...attendanceSheetSubmitted,
            roster: attendanceSheetSubmitted.roster.map((item) => ({ ...item, absent: false })),
          },
        }),
      ),
    )
    renderStaff(<ExcuseDialog lessonId={pastLesson.id} label="x" onClose={() => undefined} />)

    expect(await screen.findByText("Nobody was absent at this lesson.")).toBeInTheDocument()
  })
})

describe("student list helpers", () => {
  test("rate and GPA formats", () => {
    expect(formatRate(0.083)).toBe("8%")
    expect(formatRate(null)).toBe("–")
    expect(formatGpa(4.1)).toBe("4.10")
    expect(formatGpa(null)).toBe("–")
  })

  test("students who left are not listed", () => {
    expect(
      sortStudents([
        {
          user_id: "x",
          first_name: "X",
          last_name: "X",
          subgroup: null,
          status: "left",
          registered: true,
          absence_rate: null,
          gpa: null,
          flags: [],
        },
      ]),
    ).toEqual([])
  })
})
