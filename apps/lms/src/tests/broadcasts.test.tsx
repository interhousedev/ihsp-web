import { describe, expect, it, setDefaultTimeout } from "bun:test"
import type { CourseBroadcastBody, CourseBroadcastPatchBody } from "@ihsp/api"
import { apiUrl, ids, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { StudentsPage } from "../features/students/components/students-page"
import { authorSession, readBody, renderLms, testerSession } from "./helpers"

setDefaultTimeout(60_000)

describe("course broadcasts", () => {
  it("lists what was sent and sends a new update to the students", async () => {
    let body = null as CourseBroadcastBody | null
    server.use(
      http.post(apiUrl("/v1/staff/lms/courses/:id/broadcasts"), async ({ request, params }) => {
        body = await readBody<CourseBroadcastBody>(request)
        return HttpResponse.json(
          {
            id: "0000000c-0000-4000-8000-0000000000b2",
            course_id: params.id,
            author_id: ids.teacherRakhimov,
            ...body,
            created_at: "2026-10-10T09:00:00Z",
            recipients: 12,
          },
          { status: 201 },
        )
      }),
    )
    const { user } = renderLms(<StudentsPage courseId={ids.course} />, {
      route: `/edit/students/?id=${ids.course}`,
      session: authorSession,
    })
    expect(await screen.findByText("Week 3 is online")).toBeInTheDocument()

    await user.click(await screen.findByRole("button", { name: "Send an update" }))
    await user.type(await screen.findByLabelText("Title"), "Exam moved")
    await user.type(screen.getByLabelText("Message"), "The exam is on Friday.")
    await user.click(screen.getByRole("button", { name: "Send to students" }))

    expect(await screen.findByText("Sent to 12 students.")).toBeInTheDocument()
    expect(body).toEqual({ title: "Exam moved", body: "The exam is on Friday." })
  })

  it("edits a sent update and marks it as edited", async () => {
    let patch = null as CourseBroadcastPatchBody | null
    let edited = false
    server.use(
      http.get(apiUrl("/v1/staff/lms/courses/:id/broadcasts"), () =>
        HttpResponse.json([
          {
            id: "0000000c-0000-4000-8000-0000000000b1",
            course_id: ids.course,
            author_id: ids.teacherRakhimov,
            title: edited ? "Week 3 moved" : "Week 3 is online",
            body: "New lessons on derivatives are open.",
            created_at: "2026-10-05T09:00:00Z",
            updated_at: edited ? "2026-10-06T09:00:00Z" : null,
          },
        ]),
      ),
      http.patch(apiUrl("/v1/staff/lms/courses/:id/broadcasts/:bid"), async ({ request }) => {
        patch = await readBody<CourseBroadcastPatchBody>(request)
        edited = true
        return HttpResponse.json({ ok: true })
      }),
    )
    const { user } = renderLms(<StudentsPage courseId={ids.course} />, {
      route: `/edit/students/?id=${ids.course}`,
      session: authorSession,
    })
    expect(await screen.findByText("Week 3 is online")).toBeInTheDocument()
    expect(screen.queryByText(/edited/)).not.toBeInTheDocument()

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    const title = await screen.findByLabelText("Title")
    await user.clear(title)
    await user.type(title, "Week 3 moved")
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("Week 3 moved")).toBeInTheDocument()
    expect(patch).toEqual({ title: "Week 3 moved" })
    expect(await screen.findByText(/edited/)).toBeInTheDocument()
  })

  it("does not send an empty update", async () => {
    const { user } = renderLms(<StudentsPage courseId={ids.course} />, {
      route: `/edit/students/?id=${ids.course}`,
      session: authorSession,
    })
    await user.click(await screen.findByRole("button", { name: "Send an update" }))

    expect(await screen.findByRole("button", { name: "Send to students" })).toBeDisabled()
  })

  it("hides the broadcasts from staff who cannot publish", async () => {
    renderLms(<StudentsPage courseId={ids.course} />, { session: testerSession })

    expect(await screen.findByText("No access")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Send an update" })).not.toBeInTheDocument()
  })
})
