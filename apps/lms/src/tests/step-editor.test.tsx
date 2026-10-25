import { describe, expect, it, setDefaultTimeout } from "bun:test"
import type { StepContent, StepDraft, StepDraftBody } from "@ihsp/api"
import { apiUrl, errorHandlers, ids, server, stepContentTest, stepDraftTest } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import en from "../../messages/en.json"
import { StepEditorPage } from "../features/step-editor/components/step-editor-page"
import { authorSession, readBody, renderLms } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

const bufferKey = `lms:buffer:step:${ids.courseStepTest}`

function renderStepEditor(autosaveMs?: number) {
  return renderLms(<StepEditorPage stepId={ids.courseStepTest} autosaveMs={autosaveMs} />, {
    route: `/edit/step/?id=${ids.courseStepTest}`,
    session: authorSession,
  })
}

/** A save handler that records the bodies and answers like the server: `lock_version + 1`. */
function recordSaves(): StepDraftBody[] {
  const bodies: StepDraftBody[] = []
  server.use(
    http.put(apiUrl("/v1/lms/steps/:id/draft"), async ({ request }) => {
      const body = await readBody<StepDraftBody>(request)
      bodies.push(body)
      return HttpResponse.json({
        ...stepDraftTest,
        content: body.content,
        lock_version: body.lock_version + 1,
      } satisfies StepDraft)
    }),
  )
  return bodies
}

async function editTitle(user: ReturnType<typeof renderStepEditor>["user"], title: string) {
  const field = await screen.findByLabelText("Step title")
  await user.clear(field)
  await user.type(field, title)
}

describe("step editor: back link", () => {
  it("links back to the course the step belongs to", async () => {
    renderStepEditor()

    const link = await screen.findByRole("link", { name: en.stepEditor.backToCourse })
    // The test router normalises the trailing slash of the static route; the query names the course.
    const href = new URL(link.getAttribute("href") ?? "", "http://lms.test")
    expect(href.pathname).toMatch(/^\/edit\/?$/)
    expect(href.searchParams.get("id")).toBe(stepDraftTest.course_id)
  })
})

describe("step editor: conflict", () => {
  it("opens the conflict dialog on 409 and keeps my version with the other editor's lock_version", async () => {
    server.use(errorHandlers.conflictStepDraft)
    const { user } = renderStepEditor()
    await editTitle(user, "My title")
    await user.tab() // leaving the field saves (blur autosave)

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("This step was changed by someone else")).toBeInTheDocument()
    expect(within(dialog).getByText(/An MCP client saved this step at/)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Keep mine" })).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Take theirs" })).toBeInTheDocument()
    // Both versions are shown side by side.
    expect(within(dialog).getByTestId("step-diff")).toHaveTextContent("My title")

    const bodies = recordSaves()
    await user.click(within(dialog).getByRole("button", { name: "Keep mine" }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]?.lock_version).toBe(stepDraftTest.lock_version + 1)
    expect(bodies[0]?.content.title).toBe("My title")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(await screen.findByText("Saved")).toBeInTheDocument()
  })

  it("replaces my edits with the other version on Take theirs and sends nothing", async () => {
    const theirs: StepContent = { ...stepContentTest, title: "Their title" }
    server.use(
      http.put(apiUrl("/v1/lms/steps/:id/draft"), () =>
        HttpResponse.json(
          {
            type: "common/conflict",
            title: "Conflict",
            status: 409,
            params: { theirs: { ...stepDraftTest, content: theirs, lock_version: 9, updated_via: "ui" } },
          },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderStepEditor()
    await editTitle(user, "My title")
    await user.tab() // leaving the field saves (blur autosave)
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/Timur Rakhimov|Rakhimov Timur/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Take theirs" }))
    await waitFor(() => expect(screen.getByLabelText("Step title")).toHaveValue("Their title"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(window.localStorage.getItem(bufferKey)).toBeNull()
  })

  it("lets me close the dialog to copy by hand and reopen it later", async () => {
    server.use(errorHandlers.conflictStepDraft)
    const { user } = renderStepEditor()
    await editTitle(user, "My title")
    await user.tab() // leaving the field saves (blur autosave)
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Close and copy by hand" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByLabelText("Step title")).toHaveValue("My title")
    await user.click(await screen.findByRole("button", { name: "Review versions" }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })
})

describe("step editor: changed by AI", () => {
  it("shows the Via AI badge when the pending draft was changed by AI", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/steps/:id/draft"), () =>
        HttpResponse.json({ ...stepDraftTest, status: "changed", updated_via: "ai" } satisfies StepDraft),
      ),
    )
    renderStepEditor()
    expect(await screen.findByText("Via AI")).toBeTruthy()
    expect(screen.queryByText("Via MCP")).toBeNull()
  })

  it("shows no AI badge for a draft edited by hand", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/steps/:id/draft"), () =>
        HttpResponse.json({ ...stepDraftTest, updated_via: "ui" } satisfies StepDraft),
      ),
    )
    renderStepEditor()
    await screen.findByLabelText("Step title")
    expect(screen.queryByText("Via AI")).toBeNull()
  })
})

describe("step editor: saving", () => {
  it("autosaves changes and clears the offline buffer", async () => {
    const bodies = recordSaves()
    const { user } = renderStepEditor(100)
    await editTitle(user, "Autosaved")
    // Autosave may run while typing; the last save carries the whole text.
    await waitFor(() => expect(bodies.at(-1)?.content.title).toBe("Autosaved"))
    expect(bodies[0]?.lock_version).toBe(stepDraftTest.lock_version)
    await waitFor(() => expect(window.localStorage.getItem(bufferKey)).toBeNull())
  })

  it("keeps edits in the browser while offline and saves them when the connection returns", async () => {
    server.use(http.put(apiUrl("/v1/lms/steps/:id/draft"), () => HttpResponse.error()))
    const { user } = renderStepEditor(60_000)
    await editTitle(user, "Offline title")
    await user.tab() // leaving the field saves (blur autosave)
    expect(await screen.findByText("Offline · changes are kept in this browser")).toBeInTheDocument()
    expect(window.localStorage.getItem(bufferKey)).toContain("Offline title")

    const bodies = recordSaves()
    fireEvent(window, new Event("online"))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]?.content.title).toBe("Offline title")
    expect(await screen.findByText("Saved")).toBeInTheDocument()
    await waitFor(() => expect(window.localStorage.getItem(bufferKey)).toBeNull())
  })

  it("offers to restore edits left in the browser by an earlier session", async () => {
    const stored = { value: { ...stepContentTest, title: "Left behind" }, saved_at: "2026-10-07T05:00:00Z" }
    window.localStorage.setItem(bufferKey, JSON.stringify(stored))
    const { user } = renderStepEditor(60_000)
    expect(await screen.findByText(/Unsaved edits from an earlier session/)).toBeInTheDocument()
    expect(screen.getByLabelText("Step title")).toHaveValue("Derivative rules quiz")
    await user.click(screen.getByRole("button", { name: "Restore them" }))
    expect(screen.getByLabelText("Step title")).toHaveValue("Left behind")
    expect(screen.getByText("Saving…")).toBeInTheDocument()
  })
})

describe("step editor: autosave", () => {
  it("has no Save button and saves once after the author pauses", async () => {
    const bodies = recordSaves()
    const { user } = renderStepEditor(150)
    await editTitle(user, "Typed")
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull()
    await waitFor(() => expect(bodies.at(-1)?.content.title).toBe("Typed"))
    expect(await screen.findByText("Saved")).toBeInTheDocument()
  })

  it("shows Saving… while an edit waits for the save and the error when it fails", async () => {
    server.use(
      http.put(apiUrl("/v1/lms/steps/:id/draft"), () =>
        HttpResponse.json(
          { type: "common/internal", title: "Server error", status: 500 },
          { status: 500, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderStepEditor(60_000)
    await user.type(await screen.findByLabelText("Step title"), "x")
    expect(screen.getByText("Saving…")).toBeInTheDocument()
    await user.tab()
    expect(await screen.findByText("Could not save")).toBeInTheDocument()
  })

  it("saves pending edits when the editor is left", async () => {
    const bodies = recordSaves()
    const { user, unmount } = renderStepEditor(60_000)
    await editTitle(user, "Route change")
    unmount()
    await waitFor(() => expect(bodies.at(-1)?.content.title).toBe("Route change"))
  })
})

describe("step editor: test builder", () => {
  it("adds a question and swaps placeholder ids for the server's after saving", async () => {
    const bodies: StepDraftBody[] = []
    server.use(
      http.put(apiUrl("/v1/lms/steps/:id/draft"), async ({ request }) => {
        const body = await readBody<StepDraftBody>(request)
        bodies.push(body)
        // The server replaces every placeholder id.
        const swapped = JSON.parse(JSON.stringify(body.content).replaceAll("tmp-", "srv-")) as StepContent
        return HttpResponse.json({ ...stepDraftTest, content: swapped, lock_version: body.lock_version + 1 })
      }),
    )
    const { user } = renderStepEditor(60_000)
    await user.click(await screen.findByRole("button", { name: "Add question" }))
    expect(screen.getByText("Question 4")).toBeInTheDocument()
    // The new question is incomplete, which the editor says before publishing.
    expect(screen.getByTestId("content-issues")).toHaveTextContent("Block 1, question 4: the question text is empty.")

    await user.tab() // leaving the field saves (blur autosave)
    await waitFor(() => expect(bodies).toHaveLength(1))
    const block = bodies[0]?.content.blocks[0]
    expect(block?.type).toBe("test")
    if (block?.type !== "test") return
    expect(block.questions).toHaveLength(4)
    expect(block.questions[3]?.id.startsWith("tmp-")).toBe(true)
    expect(block.questions[0]?.id).toBe("q1")
    expect(await screen.findByText("Saved")).toBeInTheDocument()

    // A second save after more typing sends the real ids.
    await user.type(screen.getAllByLabelText("Question (Markdown)")[3] as HTMLElement, "New question?")
    await user.tab() // leaving the field saves (blur autosave)
    await waitFor(() => expect(bodies).toHaveLength(2))
    const second = bodies[1]?.content.blocks[0]
    if (second?.type !== "test") throw new Error("expected a test block")
    expect(second.questions[3]?.id.startsWith("srv-")).toBe(true)
    expect(second.questions[3]?.prompt).toBe("New question?")
  })

  it("keeps exactly one correct option for a single choice question", async () => {
    const { user } = renderStepEditor(60_000)
    const radios = await screen.findAllByLabelText(/Option .* is correct|is correct/)
    const first = radios.find((radio) => radio.getAttribute("name")?.includes("q1"))
    expect(first).toBeDefined()
    const group = radios.filter((radio) => radio.getAttribute("name") === first?.getAttribute("name"))
    expect(group.filter((radio) => (radio as HTMLInputElement).checked)).toHaveLength(1)
    await user.click(group[0] as HTMLElement)
    expect(group.filter((radio) => (radio as HTMLInputElement).checked)).toHaveLength(1)
    expect((group[0] as HTMLInputElement).checked).toBe(true)
  })
})
