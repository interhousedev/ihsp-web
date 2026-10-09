/** ADM-10, STF-4 to STF-8: the lesson page of the admin console (the staff lesson page for Administration). */
import { describe, expect, test } from "bun:test"
import type { StaffLesson } from "@ihsp/api"
import {
  adminLessons,
  adminMe,
  apiUrl,
  ids,
  resourceAttachment,
  server,
  staffLessonFor,
  teacherMe,
} from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { LessonsPage } from "../features/lessons/components/lessons-page"
import { LessonViewPage } from "../features/lessons/components/lesson-view-page"
import { LessonList } from "../features/shared/components/lesson-list"
import { ConflictList } from "../features/timetable/components/conflict-list"
import { configureTests, hrefOf, renderAdmin, setValue } from "./helpers"

configureTests()

const ROUTE = `/lessons/view/?id=${ids.lessonPhysicsToday}`
const lessonData = staffLessonFor(ids.lessonPhysicsToday) as StaffLesson

function section(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!element) throw new Error(`no section #${id}`)
  return element
}

describe("lesson page", () => {
  test("shows subject, teacher, audience, room, topic, homework, materials and the attendance sheet", async () => {
    renderAdmin(<LessonViewPage />, { route: ROUTE })

    expect(await screen.findByRole("heading", { name: "Physics" })).toBeInTheDocument()
    expect(screen.getByText("Kalandarova Gavxar")).toBeInTheDocument()
    expect(screen.getByText("2TN2")).toBeInTheDocument()
    expect(screen.getByText("102")).toBeInTheDocument()
    expect(screen.getByLabelText("Lesson topic")).toBeInTheDocument()
    expect(screen.getByLabelText("Homework text")).toHaveValue("Solve problems 14-17 on page 52")
    expect(within(section("materials")).getByText("kinematics-notes.pdf")).toBeInTheDocument()
    expect(section("attendance")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Ismoilov Jasur/ })).toBeInTheDocument()
  })

  test("goes back to the lessons list", async () => {
    renderAdmin(<LessonViewPage />, { route: ROUTE })

    const back = await screen.findByRole("link", { name: "Lessons" })
    expect(back.getAttribute("href")).toMatch(/^\/lessons\/?$/)
  })

  test("without ?id= it asks to pick a lesson", async () => {
    renderAdmin(<LessonViewPage />, { route: "/lessons/view/" })

    expect(await screen.findByText(/No lesson was chosen/)).toBeInTheDocument()
  })

  test("an unknown lesson shows an error", async () => {
    renderAdmin(<LessonViewPage />, { route: "/lessons/view/?id=missing" })

    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })
})

describe("editing as Administration", () => {
  test("the topic is saved with the staff lesson route", async () => {
    const bodies: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/staff/lessons/:id/topic"), async ({ request }) => {
        const body = (await request.json()) as { topic: string }
        bodies.push(body)
        return HttpResponse.json({ ...lessonData, lesson: { ...lessonData.lesson, topic: body.topic } })
      }),
    )
    const { user } = renderAdmin(<LessonViewPage />, { route: ROUTE })

    setValue(await screen.findByLabelText("Lesson topic"), "Newton's laws")
    await user.click(screen.getByRole("button", { name: "Save topic" }))

    await waitFor(() => expect(bodies).toEqual([{ topic: "Newton's laws" }]))
  })

  test("the attendance list is submitted with the version that was opened", async () => {
    const bodies: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/staff/lessons/:id/attendance"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({
          ...lessonData.attendance,
          submitted: true,
          version: lessonData.attendance.version + 1,
        })
      }),
    )
    const { user } = renderAdmin(<LessonViewPage />, { route: ROUTE })

    await user.click(await screen.findByRole("button", { name: /Ismoilov Jasur/ }))
    await user.click(within(section("attendance")).getByRole("button", { name: "Submit attendance" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ base_version: lessonData.attendance.version })
    expect((bodies[0] as { absent: string[] }).absent).toHaveLength(1)
  })

  test("a lesson past the teachers' window stays editable (the backend says so)", async () => {
    server.use(
      http.get(apiUrl("/v1/staff/lessons/:id"), () =>
        HttpResponse.json({
          ...lessonData,
          attendance: { ...lessonData.attendance, submitted: true, editable: true },
        }),
      ),
    )
    renderAdmin(<LessonViewPage />, { route: ROUTE })

    expect(await screen.findByRole("button", { name: /Ismoilov Jasur/ })).toBeEnabled()
    expect(screen.queryByText(/7-day window has passed/)).not.toBeInTheDocument()
  })

  test("a student's attachment can be hidden and deleted although Administration did not add it", async () => {
    const calls: string[] = []
    server.use(
      http.post(apiUrl("/v1/lessons/:id/resources/:link/hide"), () => {
        calls.push("hide")
        return HttpResponse.json({ ...resourceAttachment, hidden: true })
      }),
      http.delete(apiUrl("/v1/lessons/:id/resources/:link"), () => {
        calls.push("delete")
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAdmin(<LessonViewPage />, { route: ROUTE })
    await screen.findByText("Worked example on YouTube")

    await user.click(screen.getByRole("button", { name: `Hide ${resourceAttachment.title}` }))
    await waitFor(() => expect(calls).toEqual(["hide"]))
    await user.click(screen.getByRole("button", { name: `Delete ${resourceAttachment.title}` }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(calls).toEqual(["hide", "delete"]))
  })

  test("Add material is for this lesson only: no 'Also add to' and no request for a teacher's timetable", async () => {
    let timetableRequests = 0
    server.use(
      http.get(apiUrl("/v1/staff/timetable"), () => {
        timetableRequests += 1
        return HttpResponse.json([])
      }),
    )
    const { user } = renderAdmin(<LessonViewPage />, { route: ROUTE, session: { user: adminMe } })

    await user.click(await screen.findByRole("button", { name: "Add material" }))
    await screen.findByRole("dialog")
    fireEvent.focus(window)

    expect(screen.queryByText("Also add to")).not.toBeInTheDocument()
    expect(timetableRequests).toBe(0)
  })

  test("an administrator who also teaches may add the material to other lessons of the subject", async () => {
    let timetableRequests = 0
    server.use(
      http.get(apiUrl("/v1/staff/timetable"), () => {
        timetableRequests += 1
        return HttpResponse.json([])
      }),
    )
    const { user } = renderAdmin(<LessonViewPage />, {
      route: ROUTE,
      session: { user: { ...teacherMe, roles: ["admin", "teacher"] } },
    })

    await user.click(await screen.findByRole("button", { name: "Add material" }))
    await screen.findByRole("dialog")

    await waitFor(() => expect(timetableRequests).toBe(1))
  })
})

describe("links to the page", () => {
  const first = adminLessons[0]

  test("every row of the lessons list opens it, by the Open button and by the subject", async () => {
    if (!first) throw new Error("no lesson fixture")
    renderAdmin(<LessonsPage />, { route: "/lessons/" })

    const open = await screen.findAllByRole("link", { name: /^Open .* on / })
    expect(open.map((link) => hrefOf(link))).toContain(`/lessons/view/?id=${first.id}`)
    const subjectLinks = screen.getAllByRole("link", { name: first.subject.name })
    expect(subjectLinks.map((link) => hrefOf(link))).toContain(`/lessons/view/?id=${first.id}`)
  })

  test("a lesson list (teacher profile, Student 360) links each subject to it", () => {
    if (!first) throw new Error("no lesson fixture")
    renderAdmin(<LessonList lessons={[first]} />)

    expect(hrefOf(screen.getByRole("link", { name: first.subject.name }))).toBe(`/lessons/view/?id=${first.id}`)
  })

  test("a timetable conflict with a lesson links to that lesson", () => {
    renderAdmin(
      <ConflictList
        conflicts={[
          {
            kind: "teacher",
            description: "Teacher is busy",
            with_entry_id: null,
            with_lesson_id: ids.lessonPhysicsToday,
            week_parity: null,
          },
        ]}
      />,
    )

    expect(hrefOf(screen.getByRole("link", { name: "Open lesson" }))).toBe(
      `/lessons/view/?id=${ids.lessonPhysicsToday}`,
    )
  })

  test("no link points to the staff app any more", async () => {
    renderAdmin(<LessonsPage />, { route: "/lessons/" })
    await screen.findAllByRole("link", { name: /^Open .* on / })

    const external = [...document.querySelectorAll("a[href]")].filter((a) =>
      /^https?:\/\//.test(a.getAttribute("href") ?? ""),
    )
    expect(external).toEqual([])
  })
})
