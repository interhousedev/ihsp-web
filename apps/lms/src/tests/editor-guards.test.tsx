/**
 * Unsaved changes in the editors: the course details save on their own after a pause and when the editor unmounts,
 * and in-app navigation is guarded while edits could not be saved.
 */
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import type { CourseDraft } from "@ihsp/api"
import { apiUrl, courseDraft, ids, server, setDropdownValue } from "@ihsp/test-utils"
import { act, fireEvent, renderHook, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { CourseEditorPage } from "../features/editor/components/course-editor-page"
import { useLeaveGuard } from "../features/editor/hooks/use-leave-guard"
import { authorSession, readBody, renderLms } from "./helpers"

type MetaBody = { title: string; description: string; lock_version: number }

function recordMetaSaves(): MetaBody[] {
  const bodies: MetaBody[] = []
  server.use(
    http.put(apiUrl("/v1/lms/courses/:id/draft/meta"), async ({ request }) => {
      const body = await readBody<MetaBody>(request)
      bodies.push(body)
      return HttpResponse.json({
        ...courseDraft,
        title: body.title,
        description: body.description,
        lock_version: body.lock_version + 1,
      } satisfies CourseDraft)
    }),
  )
  return bodies
}

function renderEditor(autosaveMs = 60_000) {
  return renderLms(<CourseEditorPage courseId={ids.course} autosaveMs={autosaveMs} />, {
    route: `/edit/?id=${ids.course}`,
    session: authorSession,
  })
}

describe("course details autosave", () => {
  it("saves the title a moment after the last edit, without the 30-second tick", async () => {
    const bodies = recordMetaSaves()
    renderEditor()
    const field = await screen.findByLabelText("Course title")
    expect(await screen.findByText("Draft saved")).toBeInTheDocument()

    setDropdownValue(field, "Calculus, autumn")
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument()

    await waitFor(() => expect(bodies).toHaveLength(1), { timeout: 5000 })
    expect(bodies[0]).toMatchObject({ title: "Calculus, autumn" })
    expect(await screen.findByText("Draft saved")).toBeInTheDocument()
  })

  it("saves what is pending when the editor unmounts (an in-app route change)", async () => {
    const bodies = recordMetaSaves()
    const { unmount } = renderEditor()
    const field = await screen.findByLabelText("Course title")
    await screen.findByText("Draft saved")

    setDropdownValue(field, "Left in a hurry")
    unmount()

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ title: "Left in a hurry" })
  })
})

describe("useLeaveGuard", () => {
  let confirm = spyOn(window, "confirm").mockImplementation(() => false)
  beforeEach(() => {
    confirm = spyOn(window, "confirm").mockImplementation(() => false)
  })
  afterEach(() => {
    confirm.mockRestore()
    document.body.innerHTML = ""
  })

  function link(href: string, target?: string): HTMLAnchorElement {
    const anchor = document.createElement("a")
    anchor.href = href
    if (target) anchor.target = target
    anchor.textContent = "go"
    document.body.append(anchor)
    return anchor
  }

  it("flushes pending edits on an in-app link click and lets it through", () => {
    let flushed = 0
    renderHook(() => useLeaveGuard({ flush: () => flushed++, confirmWhen: false, message: "leave?" }))
    const anchor = link("/edit/publish/?id=c1")

    const allowed = fireEvent.click(anchor)

    expect(flushed).toBe(1)
    expect(allowed).toBe(true)
    expect(confirm).not.toHaveBeenCalled()
  })

  it("asks first while the edits could not be saved, and a refusal keeps the page", () => {
    let flushed = 0
    renderHook(() => useLeaveGuard({ flush: () => flushed++, confirmWhen: true, message: "leave?" }))
    const anchor = link("/edit/versions/?id=c1")

    const allowed = fireEvent.click(anchor)

    expect(confirm).toHaveBeenCalledWith("leave?")
    expect(allowed).toBe(false)
    expect(flushed).toBe(0)

    confirm.mockImplementation(() => true)
    expect(fireEvent.click(anchor)).toBe(true)
    expect(flushed).toBe(1)
  })

  it("ignores links to other sites, new tabs and modifier clicks", () => {
    let flushed = 0
    renderHook(() => useLeaveGuard({ flush: () => flushed++, confirmWhen: true, message: "leave?" }))

    fireEvent.click(link("https://example.com/page"))
    fireEvent.click(link("/my/", "_blank"))
    fireEvent.click(link("/my/"), { ctrlKey: true })

    expect(flushed).toBe(0)
    expect(confirm).not.toHaveBeenCalled()
  })

  it("stops guarding after unmount", () => {
    const { unmount } = renderHook(() => useLeaveGuard({ flush: () => undefined, confirmWhen: true, message: "x" }))
    unmount()
    act(() => {
      fireEvent.click(link("/my/"))
    })
    expect(confirm).not.toHaveBeenCalled()
  })
})
