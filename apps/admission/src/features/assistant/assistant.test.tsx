import { apiUrl, server, teacherMe } from "@ihsp/test-utils"
import { beforeEach, describe, expect, it } from "bun:test"
import type { ChatDetail } from "@ihsp/api"
import {
  apiUrl,
  chatDetailPending,
  ids,
  messageAssistantPending,
  messageUser,
  server,
  toolCallPending,
  turnResultApproved,
  userMe,
} from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { AssistantLauncher } from "./assistant-launcher"
import { ScreenContextProvider, ScreenSummary } from "./screen-context"
import { dockChatKey } from "./dock-chat"
import { McpPanel } from "./mcp-panel"

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
const CHAT = "0190a000-0000-7000-8000-00000000b001"
const detail: ChatDetail = { ...chatDetailPending, id: CHAT, title: "New chat", messages: [] }

const connection = {
  url: "https://api.example.test/mcp/admission",
  scopes: ["admission:read", "admission:memory", "admission:docs"],
  max_expiry_days: 90,
  example_config: {
    mcpServers: { admission: { type: "http", url: "u", headers: { Authorization: "Bearer <personal token>" } } },
  },
}

function setup(sent: unknown[], created: unknown[]) {
function serveChats() {
  let created = 0
  let tier: string | undefined
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
    http.post(apiUrl("/v1/ai/chats"), async ({ request }) => {
      created += 1
      tier = ((await request.json()) as { tier?: string }).tier
      const { messages: _m, shared: _s, ...item } = detail
      return HttpResponse.json(item)
    }),
    http.get(apiUrl("/v1/ai/chats/:id"), () => HttpResponse.json(detail)),
  )
  return { created: () => created, tier: () => tier }
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
  beforeEach(() => window.localStorage.clear())

  it("creates one smart chat, keeps it across close and remount, and does not create another", async () => {
    const chats = serveChats()
    const first = renderAdmissionApp(<AssistantLauncher />)
    await first.user.click(screen.getByRole("button", { name: "Open assistant" }))
    expect(screen.getByRole("dialog", { name: "Assistant" })).toBeInTheDocument()
    await waitFor(() => expect(window.localStorage.getItem(dockChatKey(userMe.id))).toContain(CHAT))
    expect(chats.tier()).toBe("smart")

    await first.user.click(screen.getByRole("button", { name: "Close" }))
    await first.user.click(screen.getByRole("button", { name: "Open assistant" }))
    first.unmount()

    // A route change remounts the page tree: the stored chat id is reused.
    const second = renderAdmissionApp(<AssistantLauncher />)
    await second.user.click(screen.getByRole("button", { name: "Open assistant" }))
    expect(await screen.findByRole("dialog", { name: "Assistant" })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("textbox")).toBeInTheDocument())
    expect(chats.created()).toBe(1)
  })
})

  test("staff without the student role do not see the launcher", async () => {
    renderAdmissionApp(page, { session: { user: teacherMe } })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByRole("button", { name: "Open assistant" })).toBeNull()
describe("McpPanel", () => {
  it("creates a token, shows the secret with the ready config once, lists and adds notes", async () => {
    let body = null as { name: string; scopes: string[]; expires_in_days: number; otp_code?: string } | null
    let codeSent = 0
    const notes: { id: string; content: string; source: string; created_at: string }[] = []
    server.use(
      http.get(apiUrl("/v1/admission/mcp/connection"), () => HttpResponse.json(connection)),
      http.get(apiUrl("/v1/id/personal-tokens"), () => HttpResponse.json([])),
      http.post(apiUrl("/v1/id/me/step-up"), () => {
        codeSent += 1
        return new HttpResponse(null, { status: 204 })
      }),
      http.post(apiUrl("/v1/id/personal-tokens"), async ({ request }) => {
        body = (await request.json()) as typeof body
        return HttpResponse.json({
          token: "ihsp_pat_secret",
          personal_token: {
            id: "t1",
            name: "Claude",
            prefix: "ihsp_pat_se",
            scopes: body?.scopes ?? [],
            created_at: "2026-10-01T00:00:00Z",
            expires_at: "2027-01-01T00:00:00Z",
            last_used_at: null,
            revoked_at: null,
          },
        })
      }),
      http.get(apiUrl("/v1/admission/memory-notes"), () => HttpResponse.json({ items: notes })),
      http.post(apiUrl("/v1/admission/memory-notes"), async ({ request }) => {
        const { content } = (await request.json()) as { content: string }
        const note = { id: "n1", content, source: "app", created_at: "2026-10-01T00:00:00Z" }
        notes.push(note)
        return HttpResponse.json(note)
      }),
    )
    const { user } = renderAdmissionApp(<McpPanel onBack={() => {}} />)

    await user.type(await screen.findByLabelText("Token name"), "Claude")
    expect(screen.getByRole("button", { name: "Create token" })).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Send code" }))
    await waitFor(() => expect(codeSent).toBe(1))
    await user.type(screen.getByLabelText("Code"), "123456")
    await user.click(screen.getByRole("button", { name: "Create token" }))

    const created = await screen.findByTestId("mcp-token-created")
    expect(created).toHaveTextContent("ihsp_pat_secret")
    expect(created).toHaveTextContent("Bearer ihsp_pat_secret")
    expect(body).toEqual({
      name: "Claude",
      scopes: connection.scopes,
      expires_in_days: 90,
      otp_code: "123456",
    })

    await user.type(screen.getByPlaceholderText("Something the assistant should remember…"), "Prefers CS")
    await user.click(screen.getByRole("button", { name: "Add note" }))
    expect(await screen.findByText("Prefers CS")).toBeInTheDocument()
  })
})
