import { apiUrl, server, teacherMe } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { AssistantLauncher } from "./assistant-launcher"
import { ScreenContextProvider, ScreenSummary } from "./screen-context"

const REPLY = {
  thread_id: "t1",
  message_id: "m1",
  reply: "Check the **deadline** soon.",
  citations: [{ source: "deadline", title: "MIT deadline", url_path: "/deadlines/" }],
  actions: [
    { kind: "open", label: "Open essays", url_path: "/essays/" },
    {
      kind: "propose_task",
      label: "Add to tasks",
      task: { title: "Draft essay", description: "First pass", due_on: "2026-12-01" },
    },
  ],
}

function setup(sent: unknown[], created: unknown[]) {
  server.use(
    http.get(apiUrl("/v1/admission/assistant/suggestions"), () =>
      HttpResponse.json({ items: ["What should I do next?"] }),
    ),
    http.post(apiUrl("/v1/admission/assistant/messages"), async ({ request }) => {
      sent.push(await request.json())
      return HttpResponse.json(REPLY)
    }),
    http.post(apiUrl("/v1/admission/tasks"), async ({ request }) => {
      created.push(await request.json())
      return HttpResponse.json({ id: "k1" }, { status: 201 })
    }),
  )
}

const page = (
  <ScreenContextProvider>
    <ScreenSummary title="Essays" summary="2 essays in draft" />
    <AssistantLauncher />
  </ScreenContextProvider>
)

describe("AssistantLauncher", () => {
  test("sends the screen, shows reply, citation, and confirms a proposed task", async () => {
    const sent: unknown[] = []
    const created: unknown[] = []
    setup(sent, created)
    const { user } = renderAdmissionApp(page, { route: "/essays/" })
    await user.click(await screen.findByRole("button", { name: "Open assistant" }))
    await user.click(await screen.findByRole("button", { name: "What should I do next?" }))
    const link = await screen.findByRole("link", { name: "MIT deadline" })
    expect(link.getAttribute("href")).toMatch(/^\/deadlines\/?$/)
    expect(screen.getByText("deadline", { selector: "strong" })).toBeInTheDocument()
    expect(sent[0] as object).toMatchObject({
      thread_id: null,
      message: "What should I do next?",
      screen: { path: "/essays/", title: "Essays", summary: "2 essays in draft" },
    })
    await user.click(screen.getByRole("button", { name: "Add to tasks" }))
    await waitFor(() =>
      expect(created).toEqual([
        expect.objectContaining({ title: "Draft essay", description: "First pass", deadline: "2026-12-01" }),
      ]),
    )
    expect(await screen.findByText("Task added", { selector: "p" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Close" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  test("staff without the student role do not see the launcher", async () => {
    renderAdmissionApp(page, { session: { user: teacherMe } })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByRole("button", { name: "Open assistant" })).toBeNull()
  })
})
