/** STF-4 to STF-8, UF-STF-04, UF-STF-05, UF-STF-08: the lesson page. */
import { describe, expect, test } from "bun:test"
import type { StaffLesson } from "@ihsp/api"
import { apiUrl, ids, lessonId, nbIds, resourceAttachment, resourceMaterial, server, staffLessonFor } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { LessonPage } from "../features/lessons/components/lesson-page"
import { configureTests, renderStaff, setValue } from "./helpers"

configureTests()

const ROUTE = `/lessons/view/?id=${ids.lessonPhysicsToday}`
const lessonData = staffLessonFor(ids.lessonPhysicsToday) as StaffLesson

function section(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!element) throw new Error(`no section #${id}`)
  return element
}

describe("lesson page", () => {
  test("shows the audience, room, materials, attachments, homework and attendance", async () => {
    renderStaff(<LessonPage />, { route: ROUTE })

    expect(await screen.findByRole("heading", { name: "Physics" })).toBeInTheDocument()
    expect(screen.getByText("2TN2")).toBeInTheDocument()
    expect(screen.getByText("102")).toBeInTheDocument()
    expect(within(section("materials")).getByText("Khan Academy: physics")).toBeInTheDocument()
    expect(within(section("materials")).getByText("kinematics-notes.pdf")).toBeInTheDocument()
    expect(screen.getByText("Worked example on YouTube")).toBeInTheDocument()
    expect(screen.getByLabelText("Homework text")).toHaveValue("Solve problems 14-17 on page 52")
    expect(section("attendance")).toBeInTheDocument()
    expect(screen.getByRole("radiogroup", { name: /Ismoilov Jasur/ })).toBeInTheDocument()
  })

  test("without ?id= it asks to pick a lesson", async () => {
    renderStaff(<LessonPage />, { route: "/lessons/view/" })

    expect(await screen.findByText(/No lesson was chosen/)).toBeInTheDocument()
  })

  test("an unknown lesson shows an error", async () => {
    renderStaff(<LessonPage />, { route: "/lessons/view/?id=missing" })

    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })

  test("the topic is saved with the lesson", async () => {
    const bodies: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/staff/lessons/:id/topic"), async ({ request }) => {
        const body = (await request.json()) as { topic: string }
        bodies.push(body)
        return HttpResponse.json({ ...lessonData, lesson: { ...lessonData.lesson, topic: body.topic } })
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    setValue(await screen.findByLabelText("Lesson topic"), "Newton's laws")
    await user.click(screen.getByRole("button", { name: "Save topic" }))

    await waitFor(() => expect(bodies).toEqual([{ topic: "Newton's laws" }]))
    await waitFor(() => expect(screen.getByRole("button", { name: "Save topic" })).toBeDisabled())
  })
})

describe("homework", () => {
  test("changing the text keeps the automatic due date (no due_date is sent)", async () => {
    const bodies: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/staff/lessons/:id/homework"), async ({ request }) => {
        const body = (await request.json()) as { text: string }
        bodies.push(body)
        return HttpResponse.json({
          ...lessonData,
          homework: { text: body.text, due_date: "2026-10-08", due_auto: true },
        })
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    setValue(await screen.findByLabelText("Homework text"), "Problems 14-20")
    await user.click(within(section("homework")).getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(bodies).toEqual([{ text: "Problems 14-20" }]))
  })

  test("a due date the teacher chose is sent again when only the text changes", async () => {
    const manual: StaffLesson = { ...lessonData, homework: { text: "Old", due_date: "2026-10-09", due_auto: false } }
    server.use(http.get(apiUrl("/v1/staff/lessons/:id"), () => HttpResponse.json(manual)))
    const bodies: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/staff/lessons/:id/homework"), async ({ request }) => {
        const body = (await request.json()) as { text: string }
        bodies.push(body)
        return HttpResponse.json({ ...manual, homework: { text: body.text, due_date: "2026-10-09", due_auto: false } })
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    setValue(await screen.findByLabelText("Homework text"), "New")
    await user.click(within(section("homework")).getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(bodies).toEqual([{ text: "New", due_date: "2026-10-09" }]))
  })

  test("with no next lesson the teacher is asked for a date", async () => {
    const noNext: StaffLesson = { ...lessonData, homework: { text: "Read", due_date: null, due_auto: true } }
    server.use(http.get(apiUrl("/v1/staff/lessons/:id"), () => HttpResponse.json(noNext)))
    renderStaff(<LessonPage />, { route: ROUTE })

    expect(await screen.findByText("There is no next lesson of this subject. Pick a due date.")).toBeInTheDocument()
  })

  test("deleting the homework asks first and then calls DELETE", async () => {
    let deleted = 0
    server.use(
      http.delete(apiUrl("/v1/staff/lessons/:id/homework"), () => {
        deleted += 1
        return HttpResponse.json({ ...lessonData, homework: null })
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    await screen.findByLabelText("Homework text")
    await user.click(within(section("homework")).getByRole("button", { name: "Delete homework" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(deleted).toBe(0)
    await user.click(within(dialog).getByRole("button", { name: "Delete homework" }))

    await waitFor(() => expect(deleted).toBe(1))
    await waitFor(() => expect(screen.getByLabelText("Homework text")).toHaveValue(""))
  })

  test("a lesson without homework offers Add homework", async () => {
    server.use(http.get(apiUrl("/v1/staff/lessons/:id"), () => HttpResponse.json({ ...lessonData, homework: null })))
    renderStaff(<LessonPage />, { route: ROUTE })

    expect(
      await within(await screen.findByLabelText("Homework text").then(() => section("homework"))).findByRole("button", {
        name: "Add homework",
      }),
    ).toBeDisabled()
  })
})

describe("materials and attachments", () => {
  test("hiding a student attachment sends hidden: true", async () => {
    const calls: { link: string; body: unknown }[] = []
    server.use(
      http.post(apiUrl("/v1/lessons/:lessonId/resources/:linkId/hide"), async ({ params, request }) => {
        calls.push({ link: String(params.linkId), body: await request.json() })
        return HttpResponse.json({ ...resourceAttachment, hidden: true })
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    await user.click(await screen.findByRole("button", { name: "Hide Worked example on YouTube" }))

    await waitFor(() => expect(calls).toEqual([{ link: resourceAttachment.link_id, body: { hidden: true } }]))
  })

  test("a hidden attachment is marked and can be shown again", async () => {
    server.use(
      http.get(apiUrl("/v1/staff/lessons/:id"), () =>
        HttpResponse.json({ ...lessonData, attachments: [{ ...resourceAttachment, hidden: true }] }),
      ),
    )
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/lessons/:lessonId/resources/:linkId/hide"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ ...resourceAttachment, hidden: false })
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    expect(await screen.findByText("Hidden")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Show Worked example on YouTube" }))

    await waitFor(() => expect(bodies).toEqual([{ hidden: false }]))
  })

  test("the teacher can delete their own material but not a student's attachment", async () => {
    const deleted: string[] = []
    server.use(
      http.delete(apiUrl("/v1/lessons/:lessonId/resources/:linkId"), ({ params }) => {
        deleted.push(String(params.linkId))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    await screen.findByText("Khan Academy: physics")
    expect(screen.queryByRole("button", { name: "Delete Worked example on YouTube" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Delete Khan Academy: physics" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleted).toEqual([resourceMaterial.link_id]))
  })

  test("Add material: a link as a material, also added to another lesson of the subject", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/lessons/:lessonId/resources"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json([resourceMaterial])
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    await user.click(await screen.findByRole("button", { name: "Add material" }))
    const dialog = await screen.findByRole("dialog")
    const checkboxes = await within(dialog).findAllByRole("checkbox")
    await user.click(checkboxes[0] as HTMLElement)
    await user.click(within(dialog).getByRole("tab", { name: "Link" }))
    fireEvent.change(within(dialog).getByLabelText("Link address"), { target: { value: "https://example.org/lab" } })
    await user.click(within(dialog).getByRole("button", { name: "Add link" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        { role: "material", kind: "url", target_url: "https://example.org/lab", also_lesson_ids: [lessonId(1, 2)] },
      ]),
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("Add material can add an attachment instead", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/lessons/:lessonId/resources"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json([resourceAttachment])
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    await user.click(await screen.findByRole("button", { name: "Add material" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Attachment" }))
    await user.click(within(dialog).getByRole("tab", { name: "Link" }))
    fireEvent.change(within(dialog).getByLabelText("Link address"), { target: { value: "https://example.org/slides" } })
    await user.click(within(dialog).getByRole("button", { name: "Add link" }))

    await waitFor(() =>
      expect(bodies).toEqual([{ role: "attachment", kind: "url", target_url: "https://example.org/slides" }]),
    )
  })

  test("Add material: the selected role is pressed, and a notebook output is attached to the lesson", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/notebooks/:id/artifacts/:aid/attach-to-lesson"), async ({ request, params }) => {
        bodies.push({ ...((await request.json()) as object), aid: params.aid })
        return HttpResponse.json(
          { link_id: "l1", lesson_id: lessonId(1, 1), title: "Report.docx", short_url: "https://go.test/r" },
          { status: 201 },
        )
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    await user.click(await screen.findByRole("button", { name: "Add material" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("button", { name: "Material" })).toHaveAttribute("aria-pressed", "true")
    await user.click(within(dialog).getByRole("button", { name: "Attachment" }))
    expect(within(dialog).getByRole("button", { name: "Attachment" })).toHaveAttribute("aria-pressed", "true")
    expect(within(dialog).getByRole("button", { name: "Material" })).toHaveAttribute("aria-pressed", "false")
    await user.click(within(dialog).getByRole("tab", { name: "From notebook" }))
    await user.selectOptions(await within(dialog).findByLabelText("Pick a notebook"), nbIds.notebook)
    await user.click(await within(dialog).findByRole("button", { name: "Photosynthesis: conspect" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ role: "attachment", aid: nbIds.report })
  })

  test("?add=material opens the dialog (the Today quick action)", async () => {
    renderStaff(<LessonPage />, { route: `${ROUTE}&add=material` })

    expect(await screen.findByRole("dialog")).toHaveTextContent("Add to the lesson")
  })
})
