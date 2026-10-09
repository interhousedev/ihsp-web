import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { apiUrl, courseIds, ids, setCourseWorkspaceReadOnly, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import notebooks from "../../../sp/messages/en/notebooks.json"
import { EditorNav } from "../features/editor/components/editor-nav"
import { WorkspacePage } from "../features/workspace/components/workspace-page"
import { authorSession, renderLms, testerSession } from "./helpers"
import en from "../../messages/en.json"

setDefaultTimeout(60_000)

const messages = mergeMessages(en as Messages, notebooks as Messages)

function renderWorkspace(session = authorSession) {
  return renderLms(<WorkspacePage courseId={ids.course} />, {
    route: `/edit/workspace/?id=${ids.course}`,
    session,
    messages,
  })
}

describe("course workspace page", () => {
  it("opens the workspace of the course and shows the notebook workspace", async () => {
    let opened: unknown = null
    server.use(
      http.post(apiUrl("/v1/notebooks/course-workspaces"), async ({ request }) => {
        opened = await request.json()
        return HttpResponse.json({
          notebook_id: courseIds.workspace,
          course_id: ids.course,
          title: "Mechanics for Grade 10",
          can_write: true,
          created: true,
        })
      }),
    )
    renderWorkspace()

    expect(await screen.findByRole("heading", { level: 1, name: "Mechanics for Grade 10" })).toBeInTheDocument()
    expect(opened).toEqual({ course_id: ids.course })
    expect(screen.getByRole("link", { name: "Back to the course editor" })).toHaveAttribute(
      "href",
      `/edit?id=${courseIds.course}`,
    )
  })

  it("refuses a user without edit or view_drafts and does not open anything", async () => {
    let calls = 0
    server.use(
      http.get(apiUrl("/v1/lms/courses/:id/staff"), () => HttpResponse.json([])),
      http.post(apiUrl("/v1/notebooks/course-workspaces"), () => {
        calls += 1
        return HttpResponse.json({})
      }),
    )
    renderWorkspace(testerSession)

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(calls).toBe(0)
  })

  it("shows what went wrong when the workspace cannot be opened", async () => {
    server.use(
      http.post(apiUrl("/v1/notebooks/course-workspaces"), () =>
        HttpResponse.json(
          { type: "notebooks/not-found", title: "Not found", status: 404, message_key: "notebooks-not-found" },
          { status: 404, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderWorkspace()

    expect(await screen.findByText(/The AI workspace could not be opened/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument())
  })

  it("is read-only for a reader of the course", async () => {
    setCourseWorkspaceReadOnly(true)
    server.use(
      http.post(apiUrl("/v1/notebooks/course-workspaces"), () =>
        HttpResponse.json({
          notebook_id: courseIds.workspace,
          course_id: ids.course,
          title: "Mechanics for Grade 10",
          can_write: false,
          created: false,
        }),
      ),
    )
    renderWorkspace()

    expect((await screen.findAllByText("You can read this workspace but not change it.")).length).toBeGreaterThan(0)
    expect(screen.queryByRole("button", { name: "Add sources" })).not.toBeInTheDocument()
  })
})

describe("course tools navigation", () => {
  it("links to the AI workspace for staff who can edit or view drafts", () => {
    renderLms(<EditorNav courseId={ids.course} current="outline" permissions={["edit"]} />)

    expect(screen.getByRole("link", { name: "AI workspace" })).toHaveAttribute(
      "href",
      `/edit/workspace?id=${ids.course}`,
    )
  })

  it("hides it from reviewers", () => {
    renderLms(<EditorNav courseId={ids.course} current="outline" permissions={["review"]} />)

    expect(screen.queryByRole("link", { name: "AI workspace" })).not.toBeInTheDocument()
  })
})
