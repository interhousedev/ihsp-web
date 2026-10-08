import { describe, expect, it, setDefaultTimeout } from "bun:test"
import {
  apiUrl,
  chatAdmin,
  ids,
  linkChatShare,
  renderWithProviders,
  server,
  turnResultApproved,
  turnResultRejected,
  usageLimitReached,
} from "@ihsp/test-utils"
import { configure, screen, waitFor, within } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { AssistantChat } from "./assistant-chat"

// The first render of a page in a cold test run takes a few seconds.
configure({ asyncUtilTimeout: 8000 })
setDefaultTimeout(30_000)

function renderChat(chatId: string) {
  return renderWithProviders(<AssistantChat assistant="student" />, {
    route: `/assistant/chat/?id=${chatId}`,
  })
}

async function readBody(request: Request): Promise<unknown> {
  return request.json()
}

/** Pasting is one event; typing every character makes the large chat tree re-render dozens of times. */
async function enter(user: UserEvent, field: HTMLElement, text: string): Promise<void> {
  await user.click(field)
  await user.paste(text)
}

describe("AssistantChat: messages (UF-WEB-19, AI-1)", () => {
  it("shows the assistant's reply after sending a message", async () => {
    const { user } = renderChat(ids.chat2)
    await screen.findByText("Explain Newton's second law")

    await enter(user, screen.getByRole("textbox", { name: "Message" }), "What is momentum?")
    await user.click(screen.getByRole("button", { name: "Send" }))

    expect(await screen.findByText('You asked: "What is momentum?". Here is a short answer.')).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("")
  })

  it("sends the files attached from My files with the message (AI-7)", async () => {
    let sent: unknown
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), async ({ request }) => {
        sent = await readBody(request)
        return HttpResponse.json({
          chat: {
            id: ids.chat2,
            assistant: "student",
            title: "Homework help",
            last_message_at: "2026-10-07T05:12:00Z",
            pending_approvals: 0,
          },
          new_messages: [],
          status: "done",
          usage: {
            session: { used: 1, limit: 100, resets_at: null },
            day: { used: 1, limit: 100, resets_at: "2026-10-08T00:00:00Z" },
          },
        })
      }),
    )
    const { user } = renderChat(ids.chat2)
    await screen.findByText("Explain Newton's second law")

    await user.click(screen.getByRole("button", { name: "Choose from My files" }))
    const dialog = await screen.findByRole("dialog")
    expect(await within(dialog).findByLabelText(/lab-setup\.jpg/)).toBeDisabled()
    await user.click(await within(dialog).findByLabelText(/kinematics-notes\.pdf/))
    await user.click(within(dialog).getByRole("button", { name: "Attach 1 file" }))
    await enter(user, screen.getByRole("textbox", { name: "Message" }), "Summarize this")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(sent).toEqual({ text: "Summarize this", file_ids: [ids.file] }))
  })

  it("shows the error and keeps the draft when the message cannot be sent", async () => {
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), () =>
        HttpResponse.json(
          { type: "ai/provider-error", status: 503, title: "Provider error" },
          { status: 503, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderChat(ids.chat2)
    await screen.findByText("Explain Newton's second law")

    await enter(user, screen.getByRole("textbox", { name: "Message" }), "Hello there")
    await user.click(screen.getByRole("button", { name: "Send" }))

    expect(await screen.findByText(/The assistant is not available right now/)).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Hello there")
  })
})

describe("AssistantChat: approval cards (UF-WEB-20, AI-3, AI-11)", () => {
  it("highlights sensitive fields on the approval card", async () => {
    renderChat(ids.chat)

    const card = await screen.findByRole("region", { name: "Create flash card set" })

    expect(within(card).getByText("Public link after approval").closest("[data-sensitive]")).toHaveAttribute(
      "data-sensitive",
      "true",
    )
    expect(within(card).getByText("12").closest("[data-sensitive]")).toHaveAttribute("data-sensitive", "false")
    expect(within(card).getByRole("button", { name: "Approve" })).toBeInTheDocument()
    expect(within(card).getByRole("button", { name: "Reject" })).toBeInTheDocument()
  })

  it("shows read tools as one-line notes", async () => {
    renderChat(ids.chat)

    expect(await screen.findByText("Looked up your timetable")).toBeInTheDocument()
  })

  it("approves the action and shows the assistant's follow-up", async () => {
    let approved = 0
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat}/tool-calls/${ids.toolCallPending}/approve`), () => {
        approved += 1
        return HttpResponse.json(turnResultApproved)
      }),
    )
    const { user } = renderChat(ids.chat)

    await user.click(await screen.findByRole("button", { name: "Approve" }))

    expect(await screen.findByText(/with 12 cards is in your flash cards/)).toBeInTheDocument()
    expect(approved).toBe(1)
    await waitFor(() => expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument())
  })

  it("opens the reason field on Reject and sends the reason", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat}/tool-calls/${ids.toolCallPending}/reject`), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json(turnResultRejected("make the cards shorter"))
      }),
    )
    const { user } = renderChat(ids.chat)

    await user.click(await screen.findByRole("button", { name: "Reject" }))
    await enter(user, screen.getByLabelText("Reason (optional)"), "make the cards shorter")
    await user.click(screen.getByRole("button", { name: "Send rejection" }))

    await waitFor(() => expect(body).toEqual({ reason: "make the cards shorter" }))
    expect(await screen.findByText("Reason: make the cards shorter")).toBeInTheDocument()
    expect(screen.getByText("Understood, I did not create the set.")).toBeInTheDocument()
  })

  it("rejects without a reason when the field stays empty", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat}/tool-calls/${ids.toolCallPending}/reject`), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json(turnResultRejected(null))
      }),
    )
    const { user } = renderChat(ids.chat)

    await user.click(await screen.findByRole("button", { name: "Reject" }))
    await user.click(screen.getByRole("button", { name: "Send rejection" }))

    await waitFor(() => expect(body).toEqual({}))
  })
})

describe("AssistantChat: limits (UF-WEB-21, AI-8)", () => {
  it("shows the remaining budget under the input", async () => {
    renderChat(ids.chat2)

    const usage = await screen.findByRole("group", { name: "Assistant usage" })

    expect(within(usage).getByText("12k / 100k")).toBeInTheDocument()
    expect(within(usage).getByText("48k / 300k")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toBeEnabled()
  })

  it("disables the input at the limit and shows the reset time", async () => {
    server.use(http.get(apiUrl("/v1/ai/usage"), () => HttpResponse.json(usageLimitReached)))
    renderChat(ids.chat2)

    expect(await screen.findByText("Session limit reached, available again at 13:00")).toBeInTheDocument()

    expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
  })

  it("locks the input when the server answers ai/limit-reached", async () => {
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), () =>
        HttpResponse.json(
          { type: "ai/limit-reached", status: 429, title: "Limit reached" },
          { status: 429, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderChat(ids.chat2)
    await screen.findByText("Explain Newton's second law")
    server.use(http.get(apiUrl("/v1/ai/usage"), () => HttpResponse.json(usageLimitReached)))

    await enter(user, screen.getByRole("textbox", { name: "Message" }), "One more question")
    await user.click(screen.getByRole("button", { name: "Send" }))

    expect(await screen.findByText("Session limit reached, available again at 13:00")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled()
  })
})

describe("AssistantChat: sharing (UF-WEB-24, SHR-3, SHR-8)", () => {
  it("defaults to Snapshot and creates a snapshot link", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/shares"), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({
          id: "00000009-0000-4000-8000-0000000000aa",
          slug: "newslug1",
          kind: "chat",
          url: "http://localhost:3006/ai/newslug1",
          target_url: null,
          file: null,
          title: "Homework help",
          lesson_id: null,
          share_mode: "snapshot",
          hits: 0,
          created_at: "2026-10-07T05:12:00Z",
          expires_at: null,
          revoked_at: null,
          disabled: false,
        })
      }),
    )
    const { user } = renderChat(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "Share" }))
    const dialog = await screen.findByRole("dialog")
    const toggle = within(dialog).getByRole("switch", { name: "Include future messages" })

    expect(toggle).not.toBeChecked()
    expect(within(dialog).getByTestId("share-mode-hint")).toHaveTextContent("Snapshot")
    expect(within(dialog).getByText(/may contain personal data/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Create link" }))

    await waitFor(() => expect(body).toEqual({ kind: "chat", target_id: ids.chat2, share_mode: "snapshot" }))
    expect(await within(dialog).findByRole("link", { name: "http://localhost:3006/ai/newslug1" })).toBeInTheDocument()
  })

  it("creates a live link when future messages are included", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/shares"), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({ ...linkChatShare, share_mode: "live" })
      }),
    )
    const { user } = renderChat(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "Share" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("switch", { name: "Include future messages" }))
    await user.click(within(dialog).getByRole("button", { name: "Create link" }))

    await waitFor(() => expect(body).toEqual({ kind: "chat", target_id: ids.chat2, share_mode: "live" }))
  })

  it("lists this chat's existing links with Copy and Revoke", async () => {
    let revoked = ""
    server.use(
      http.post(apiUrl("/v1/links/:id/revoke"), ({ params }) => {
        revoked = String(params.id)
        return HttpResponse.json({ ...linkChatShare, revoked_at: "2026-10-07T05:20:00Z" })
      }),
    )
    const { user } = renderChat(ids.chat)

    await user.click(await screen.findByRole("button", { name: "Share" }))
    const dialog = await screen.findByRole("dialog")
    expect(await within(dialog).findByRole("link", { name: "http://localhost:3006/ai/kq7x2m9a" })).toBeInTheDocument()
    expect(within(dialog).getByText("Snapshot", { selector: "[data-slot=badge]" })).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Revoke" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Revoke" }))

    await waitFor(() => expect(revoked).toBe(ids.linkChat))
  })
})

describe("AssistantChat: administration assistant (AI-12)", () => {
  it("lists only administration chats", async () => {
    renderWithProviders(<AssistantChat assistant="admin" />, { route: "/assistant/" })

    expect(await screen.findByText("Weekly attendance")).toBeInTheDocument()
    expect(screen.queryByText("Kinematics revision")).not.toBeInTheDocument()
  })

  it("cannot share an administration chat", async () => {
    renderWithProviders(<AssistantChat assistant="admin" />, {
      route: `/assistant/chat/?id=${chatAdmin.id}`,
    })

    expect(await screen.findByRole("textbox", { name: "Message" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument()
  })
})

describe("AssistantChat: chat list (AI-1)", () => {
  it("renames a chat", async () => {
    let body: unknown
    server.use(
      http.patch(apiUrl(`/v1/ai/chats/${ids.chat2}`), async ({ request }) => {
        body = await readBody(request)
        return HttpResponse.json({
          id: ids.chat2,
          assistant: "student",
          title: "Physics homework",
          last_message_at: "2026-10-05T17:20:00Z",
          pending_approvals: 0,
        })
      }),
    )
    const { user } = renderWithProviders(<AssistantChat assistant="student" />, { route: "/assistant/" })

    await user.click(await screen.findByRole("button", { name: "Rename chat Homework help" }))
    const input = await screen.findByLabelText("Title")
    await user.clear(input)
    await enter(user, input, "Physics homework")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(body).toEqual({ title: "Physics homework" }))
    expect(await screen.findByText("Physics homework")).toBeInTheDocument()
  })

  it("deletes a chat after confirmation", async () => {
    let deleted = ""
    server.use(
      http.delete(apiUrl("/v1/ai/chats/:id"), ({ params }) => {
        deleted = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderWithProviders(<AssistantChat assistant="student" />, { route: "/assistant/" })

    await user.click(await screen.findByRole("button", { name: "Delete chat Homework help" }))
    await user.click(await screen.findByRole("button", { name: "Delete chat" }))

    await waitFor(() => expect(deleted).toBe(ids.chat2))
    await waitFor(() => expect(screen.queryByText("Homework help")).not.toBeInTheDocument())
  })

  it("lists only the chats of this assistant", async () => {
    renderWithProviders(<AssistantChat assistant="student" />, { route: "/assistant/" })

    expect(await screen.findByText("Kinematics revision")).toBeInTheDocument()
    expect(screen.queryByText("Weekly attendance")).not.toBeInTheDocument()
    expect(screen.getByText("1 action waiting")).toBeInTheDocument()
  })
})
