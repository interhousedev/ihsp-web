import { describe, expect, it, setDefaultTimeout } from "bun:test"
import type { DragEndEvent } from "@dnd-kit/core"
import { apiUrl, courseDraft, courseOutline, ids, server } from "@ihsp/test-utils"
import { renderHook, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { CourseEditorPage } from "../features/editor/components/course-editor-page"
import { useOutlineDnd } from "../features/editor/hooks/use-outline-dnd"
import { stepDragId } from "../features/editor/utils/outline-ops"
import { authorSession, readBody, renderLms, testerSession } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

function renderEditor(session = authorSession) {
  return renderLms(<CourseEditorPage courseId={ids.course} />, { route: `/edit/?id=${ids.course}`, session })
}

describe("outline drag and drop", () => {
  it("turns a finished drag of a step into a move_step operation", () => {
    const sent: unknown[] = []
    const { result } = renderHook(() => useOutlineDnd(courseOutline, (ops) => sent.push(ops)))
    result.current.onDragEnd({
      active: { id: stepDragId(ids.courseStepText) },
      over: { id: stepDragId(ids.courseStepCards) },
    } as unknown as DragEndEvent)
    expect(sent).toEqual([
      [{ op: "move_step", step_id: ids.courseStepText, to_section_id: ids.courseSectionRules, position: 1 }],
    ])
  })

  it("sends nothing when the step is dropped where it was", () => {
    const sent: unknown[] = []
    const { result } = renderHook(() => useOutlineDnd(courseOutline, (ops) => sent.push(ops)))
    result.current.onDragEnd({
      active: { id: stepDragId(ids.courseStepText) },
      over: { id: stepDragId(ids.courseStepText) },
    } as unknown as DragEndEvent)
    result.current.onDragEnd({ active: { id: stepDragId(ids.courseStepText) }, over: null } as unknown as DragEndEvent)
    expect(sent).toEqual([])
  })
})

describe("course editor outline", () => {
  it("shows the save state, the badges and the steps of the draft", async () => {
    renderEditor()
    expect(await screen.findByText("Derivative rules quiz")).toBeInTheDocument()
    expect(await screen.findByText("Draft saved")).toBeInTheDocument()
    expect(screen.getByText("Changed")).toBeInTheDocument()
    expect(screen.getByText("New")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Derivative rules quiz" })).toHaveAttribute(
      "href",
      expect.stringContaining(`id=${ids.courseStepTest}`),
    )
  })

  it("sends move_step with the draft's lock_version when a step is moved", async () => {
    let body: unknown = null
    server.use(
      http.post(apiUrl("/v1/lms/courses/:id/draft/outline"), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json(courseDraft)
      }),
    )
    const { user } = renderEditor()
    await user.click(await screen.findByRole("button", { name: "Move step Derivative rules quiz down" }))
    await waitFor(() =>
      expect(body).toEqual({
        ops: [{ op: "move_step", step_id: ids.courseStepTest, to_section_id: ids.courseSectionRules, position: 1 }],
        lock_version: courseDraft.lock_version,
      }),
    )
  })

  it("moves a step into the section above at the edge", async () => {
    let body = null as { ops: unknown[] } | null
    server.use(
      http.post(apiUrl("/v1/lms/courses/:id/draft/outline"), async ({ request }) => {
        body = await readBody<{ ops: unknown[] }>(request)
        return HttpResponse.json(courseDraft)
      }),
    )
    const { user } = renderEditor()
    await user.click(await screen.findByRole("button", { name: "Move step Derivative rules quiz up" }))
    await waitFor(() =>
      expect(body?.ops).toEqual([
        { op: "move_step", step_id: ids.courseStepTest, to_section_id: ids.courseSectionIntro, position: 1 },
      ]),
    )
  })

  it("adds a section", async () => {
    let body: unknown = null
    server.use(
      http.post(apiUrl("/v1/lms/courses/:id/draft/outline"), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json(courseDraft)
      }),
    )
    const { user } = renderEditor()
    await user.type(await screen.findByLabelText("New module"), "Homework")
    await user.click(screen.getByRole("button", { name: "Add module" }))
    await waitFor(() =>
      expect(body).toEqual({ ops: [{ op: "add_section", title: "Homework" }], lock_version: courseDraft.lock_version }),
    )
  })

  it("rolls the order back and shows the error when the server refuses a move", async () => {
    server.use(
      http.post(apiUrl("/v1/lms/courses/:id/draft/outline"), () =>
        HttpResponse.json(
          { type: "common/conflict", title: "Conflict", status: 409, params: {} },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderEditor()
    await user.click(await screen.findByRole("button", { name: "Move step Derivative rules quiz down" }))
    expect(await screen.findByText(/Someone changed this at the same time/)).toBeInTheDocument()
    const links = screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.includes("/edit/step"))
    expect(links.map((link) => link.textContent)).toEqual([
      "What is a derivative?",
      "Derivative rules quiz",
      "Key formulas",
    ])
  })

  it("hides the editing controls from staff who can only view drafts", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:id/draft"), () =>
        HttpResponse.json({ ...courseDraft, my_permissions: ["view_drafts"] }),
      ),
    )
    renderEditor(testerSession)
    expect(await screen.findByText("Derivative rules quiz")).toBeInTheDocument()
    expect(screen.getByText("You can view the draft but not change it.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Move step/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add module" })).not.toBeInTheDocument()
  })

  it("denies people who are not course staff", async () => {
    // the default session is the demo student, who is not on the course staff
    renderEditor({})
    expect(await screen.findByText("No access")).toBeInTheDocument()
  })
})

describe("course editor status", () => {
  it("shows a saved draft and the unpublished changes with a Publish link, and no Save button", async () => {
    renderEditor()
    expect(await screen.findByText("Draft saved")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull()
    const pending = screen.getByText(/unpublished change/)
    expect(within(pending.parentElement as HTMLElement).getByRole("link", { name: "Publish" })).toHaveAttribute(
      "href",
      expect.stringContaining("publish"),
    )
  })
})
