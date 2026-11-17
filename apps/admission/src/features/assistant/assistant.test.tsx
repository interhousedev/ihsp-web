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
import { renderAdmissionApp } from "../../tests/helpers"
import { AssistantLauncher } from "./assistant-launcher"
import { dockChatKey } from "./dock-chat"
import { McpPanel } from "./mcp-panel"

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

function serveChats() {
  let created = 0
  let tier: string | undefined
  server.use(
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

describe("AssistantLauncher", () => {
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

describe("AssistantLauncher: suggestion approval", () => {
  beforeEach(() => window.localStorage.clear())

  it("shows the admission_add_suggestion approval card and approves it", async () => {
    const pending = {
      ...toolCallPending,
      tool: "admission_add_suggestion",
      note: "Add SAT Prep to your plan",
      preview: { title: "Add SAT Prep", fields: [{ label: "Course", value: "SAT Prep", sensitive: false }], items: [] },
    }
    const chat = {
      ...chatDetailPending,
      id: ids.chat,
      messages: [messageUser, { ...messageAssistantPending, tool_calls: [pending] }],
    }
    let approved = 0
    server.use(
      http.get(apiUrl(`/v1/ai/chats/${ids.chat}`), () => HttpResponse.json(chat)),
      http.post(apiUrl(`/v1/ai/chats/${ids.chat}/tool-calls/${toolCallPending.id}/approve`), () => {
        approved += 1
        return HttpResponse.json(turnResultApproved)
      }),
    )
    window.localStorage.setItem(dockChatKey(userMe.id), JSON.stringify({ chatId: ids.chat, tier: "smart" }))
    const { user } = renderAdmissionApp(<AssistantLauncher />)
    await user.click(screen.getByRole("button", { name: "Open assistant" }))

    await user.click(await screen.findByRole("button", { name: "Approve" }))
    await waitFor(() => expect(approved).toBe(1))
  })
})
