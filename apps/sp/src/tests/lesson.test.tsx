/** WEB-9–11, UF-WEB-06–08: the lesson page, attachments. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, ids, lessonId, resourceAttachment, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { LessonPage } from "../features/lessons/components/lesson-page"
import { configureTests, freezeTime, renderSp, setValue, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

const TODAY_ROUTE = `/lessons/view/?id=${ids.lessonPhysicsToday}`
const PAST_ROUTE = `/lessons/view/?id=${lessonId(1, 1)}`

describe("lesson page", () => {
  test("shows subject, time, teacher, materials, homework, attachments and my result", async () => {
    renderSp(<LessonPage />, { route: TODAY_ROUTE })

    expect(await screen.findByRole("heading", { name: "Physics" })).toBeInTheDocument()
    expect(screen.getByText(/Period 3/)).toBeInTheDocument()
    expect(screen.getByText("Khan Academy: physics")).toBeInTheDocument()
    expect(screen.getByText("kinematics-notes.pdf")).toBeInTheDocument()
    expect(screen.getByText("Solve problems 14-17 on page 52")).toBeInTheDocument()
    expect(screen.getByText("Worked example on YouTube")).toBeInTheDocument()
    expect(screen.getByText("Not taken yet")).toBeInTheDocument()
  })

  test("Add attachment is shown when the lesson allows it", async () => {
    renderSp(<LessonPage />, { route: TODAY_ROUTE })

    expect(await screen.findByRole("button", { name: "Add attachment" })).toBeInTheDocument()
  })

  test("Add attachment is missing for a lesson outside the window", async () => {
    renderSp(<LessonPage />, { route: PAST_ROUTE })

    await screen.findByRole("heading", { name: "Mathematics" })

    expect(screen.queryByRole("button", { name: "Add attachment" })).not.toBeInTheDocument()
  })

  test("only the student's own attachment has a delete button, and deleting asks first", async () => {
    const deleted: string[] = []
    server.use(
      http.delete(apiUrl("/v1/lessons/:lessonId/resources/:linkId"), ({ params }) => {
        deleted.push(String(params.linkId))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderSp(<LessonPage />, { route: TODAY_ROUTE })

    await screen.findByText("Worked example on YouTube")
    expect(screen.getAllByRole("button", { name: /^Delete / })).toHaveLength(1)
    await user.click(screen.getByRole("button", { name: "Delete Worked example on YouTube" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(deleted).toEqual([])
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleted).toEqual([resourceAttachment.link_id]))
  })

  test("a link is added as an attachment with its URL", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/lessons/:lessonId/resources"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json([resourceAttachment])
      }),
    )
    const { user } = renderSp(<LessonPage />, { route: TODAY_ROUTE })

    await user.click(await screen.findByRole("button", { name: "Add attachment" }))
    await user.click(await screen.findByRole("tab", { name: "Link" }))
    setValue(screen.getByLabelText("Link address"), "https://example.org/notes")
    await user.click(screen.getByRole("button", { name: "Add link" }))

    await waitFor(() =>
      expect(bodies).toEqual([{ role: "attachment", kind: "url", target_url: "https://example.org/notes" }]),
    )
  })

  test("a refused attachment shows the reason", async () => {
    server.use(
      http.post(apiUrl("/v1/lessons/:lessonId/resources"), () =>
        HttpResponse.json(
          { type: "links/blocked-url", title: "Blocked", status: 422 },
          { status: 422, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderSp(<LessonPage />, { route: TODAY_ROUTE })

    await user.click(await screen.findByRole("button", { name: "Add attachment" }))
    await user.click(await screen.findByRole("tab", { name: "Link" }))
    setValue(screen.getByLabelText("Link address"), "https://bad.example")
    await user.click(screen.getByRole("button", { name: "Add link" }))

    expect(await screen.findByText("This address cannot be shortened.")).toBeInTheDocument()
  })

  test("a lesson that does not exist shows the error state", async () => {
    renderSp(<LessonPage />, { route: "/lessons/view/?id=00000000-0000-0000-0000-000000000000" })

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  test("without an id it says the lesson was not found", () => {
    renderSp(<LessonPage />, { route: "/lessons/view/" })

    expect(screen.getByText("Lesson not found.")).toBeInTheDocument()
  })
})
