import { describe, expect, it, mock } from "bun:test"
import {
  apiUrl,
  chatHomework,
  currentWebQuota,
  ids,
  problem,
  server,
  setWebQuota,
  testRouter,
  turnResultApproved,
  turnResultRejected,
  usageLimitReached,
  webQuotaDisabled,
} from "@ihsp/test-utils"
import type { ChatDetail, ChatMessageView } from "@ihsp/api"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, delay, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { AssistantChatPane } from "./assistant-chat-pane"
import { pendingTurnKey } from "./pending-turn"
import { webSwitchKey } from "./use-web-switch"

allowSlowRenders()

function renderPane(chatId: string) {
  return renderNotebook(<AssistantChatPane chatId={chatId} basePath="/assistant" navButtons={null} />, {
    route: `/assistant/chat/?id=${chatId}`,
  })
}

function message(seq: number, role: "user" | "assistant", text: string): ChatMessageView {
  return { seq, role, text, file_ids: [], tool_calls: [], created_at: "2026-10-05T17:20:00Z", web: [], feedback: null }
}

function serveChat(messages: ChatMessageView[]) {
  const detail: ChatDetail = { ...chatHomework, messages, shared: false }
  server.use(http.get(apiUrl(`/v1/ai/chats/${ids.chat2}`), () => HttpResponse.json(detail)))
}

/** Whether an element between `node` and `root` is a muted bubble (never `expect` an element: a failure dumps the DOM). */
function hasBubble(node: HTMLElement, root: HTMLElement): boolean {
  for (let current: HTMLElement | null = node; current && current !== root; current = current.parentElement) {
    if (current.classList.contains("bg-muted")) return true
  }
  return false
}

const NEWTON = "Newton's second law says that **force = mass x acceleration**."

describe("AssistantChatPane: messages", () => {
  it("shows the student's message in a bubble and the answer as plain Markdown without one", async () => {
    renderPane(ids.chat2)

    const user = await screen.findByText("Explain Newton's second law")
    expect(user.closest("[data-role=user]")).toBeInTheDocument()

    const answer = screen.getByRole("article", { name: "Assistant" })
    const strong = within(answer).getByText("force = mass x acceleration")
    expect(strong.tagName).toBe("STRONG")
    expect(hasBubble(strong, answer)).toBe(false)
    expect(hasBubble(user, screen.getByRole("article", { name: "You" }))).toBe(true)
  })

  it("shows the title in the header and the shared banner", async () => {
    renderPane(ids.chat2)

    expect(await screen.findByRole("button", { name: "Homework help" })).toBeInTheDocument()
    expect(screen.getByText(/This chat is shared publicly/)).toBeInTheDocument()
  })

  it("tells the student that an empty chat is empty", async () => {
    serveChat([])
    renderPane(ids.chat2)

    expect(await screen.findByText(/Ask a question to start/)).toBeInTheDocument()
  })

  it("shows a loading state and then an error with a retry", async () => {
    server.use(http.get(apiUrl(`/v1/ai/chats/${ids.chat2}`), () => HttpResponse.error()))
    const { user } = renderPane(ids.chat2)

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument()
    const retry = await screen.findByRole("button", { name: "Try again" })
    server.resetHandlers()
    await user.click(retry)

    expect(await screen.findByText("Explain Newton's second law")).toBeInTheDocument()
  })

  it("sends a message, shows it at once with Thinking… and then the answer", async () => {
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), async () => {
        await delay(150)
        return HttpResponse.json({
          chat: chatHomework,
          new_messages: [
            message(3, "user", "What is momentum?"),
            message(4, "assistant", "Momentum is **mass times velocity**."),
          ],
          status: "done",
          usage: {
            session: { used: 1, limit: 100, resets_at: null },
            day: { used: 1, limit: 100, resets_at: "2026-10-08T00:00:00Z" },
          },
        })
      }),
    )
    const { user } = renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")

    await user.click(screen.getByRole("textbox", { name: "Message" }))
    await user.paste("What is momentum?")
    await user.click(screen.getByRole("button", { name: "Send" }))

    expect(await screen.findByTestId("pending-message")).toHaveTextContent("What is momentum?")
    expect(screen.getByRole("status", { name: "" })).toHaveTextContent("Thinking…")
    expect(await screen.findByText("mass times velocity")).toBeInTheDocument()
    expect(screen.queryByTestId("pending-message")).not.toBeInTheDocument()
    expect(screen.queryByText("Thinking…")).not.toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("")
  })

  it("runs the first message that the home composer left for this chat, once", async () => {
    window.sessionStorage.setItem(
      pendingTurnKey(ids.chat2),
      JSON.stringify({ text: "What is momentum?", file_ids: [] }),
    )
    let sent = 0
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), async ({ request }) => {
        sent += 1
        const body = (await request.json()) as { text: string }
        return HttpResponse.json({
          chat: chatHomework,
          new_messages: [message(3, "user", body.text), message(4, "assistant", `You asked: ${body.text}`)],
          status: "done",
          usage: {
            session: { used: 1, limit: 100, resets_at: null },
            day: { used: 1, limit: 100, resets_at: "2026-10-08T00:00:00Z" },
          },
        })
      }),
    )
    renderPane(ids.chat2)

    expect(await screen.findByText("You asked: What is momentum?")).toBeInTheDocument()
    expect(sent).toBe(1)
    expect(window.sessionStorage.getItem(pendingTurnKey(ids.chat2))).toBeNull()
  })

  it("shows the server error and keeps the draft when the message cannot be sent", async () => {
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), () =>
        HttpResponse.json(
          { type: "ai/provider-error", status: 503, title: "Provider error" },
          { status: 503, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")

    await user.click(screen.getByRole("textbox", { name: "Message" }))
    await user.paste("Hello there")
    await user.click(screen.getByRole("button", { name: "Send" }))

    expect(await screen.findByText(/The assistant is not available right now/)).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Hello there")
  })

  it("does not offer the tier picker inside a chat", async () => {
    renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")

    expect(screen.queryByRole("button", { name: /Answer mode/ })).not.toBeInTheDocument()
  })

  it("shows the scroll-to-latest button after scrolling up and scrolls down on click", async () => {
    const { user } = renderPane(ids.chat2)
    const log = await screen.findByRole("log", { name: "Messages" })
    const scroller = log.parentElement as HTMLElement
    const scrollTo = mock((_options: ScrollToOptions) => undefined)
    scroller.scrollTo = scrollTo as unknown as typeof scroller.scrollTo
    Object.defineProperty(scroller, "scrollHeight", { value: 2000, configurable: true })
    Object.defineProperty(scroller, "clientHeight", { value: 500, configurable: true })
    expect(screen.queryByRole("button", { name: "Scroll to the latest message" })).not.toBeInTheDocument()

    scroller.scrollTop = 100
    fireEvent.scroll(scroller)
    await user.click(await screen.findByRole("button", { name: "Scroll to the latest message" }))

    expect(scrollTo).toHaveBeenCalled()
    expect(scrollTo.mock.calls.at(-1)?.[0]).toMatchObject({ top: 2000 })
    expect(screen.queryByRole("button", { name: "Scroll to the latest message" })).not.toBeInTheDocument()
  })
})

describe("AssistantChatPane: long user message", () => {
  const long = Array.from({ length: 8 }, (_, index) => `Line ${index + 1} of my question`).join("\n")

  it("clips a message of more than six lines with a chevron and expands it", async () => {
    serveChat([message(1, "user", long), message(2, "assistant", "Got it.")])
    const { user } = renderPane(ids.chat2)

    const text = await screen.findByText(/Line 1 of my question/)
    expect(text).toHaveAttribute("data-clamped", "true")
    const toggle = screen.getByRole("button", { name: "Show more" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")

    await user.click(toggle)

    expect(text).toHaveAttribute("data-clamped", "false")
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true")
  })

  it("clips a message of more than 400 characters", async () => {
    serveChat([message(1, "user", "word ".repeat(100)), message(2, "assistant", "Got it.")])
    renderPane(ids.chat2)

    expect(await screen.findByRole("button", { name: "Show more" })).toBeInTheDocument()
  })

  it("does not clip a short message", async () => {
    renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")

    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument()
  })

  it("shows guided learning as a badge instead of the hint line", async () => {
    const hint =
      "Guided learning: explain step by step, ask me questions and check my understanding before giving the full answer."
    serveChat([message(1, "user", `${hint}\n\nWhat is a vector?`), message(2, "assistant", "A vector has a size.")])
    renderPane(ids.chat2)

    expect(await screen.findByText("What is a vector?")).toBeInTheDocument()
    expect(screen.queryByText(/explain step by step/)).not.toBeInTheDocument()
    expect(screen.getByText("Guided learning")).toBeInTheDocument()
  })
})

describe("AssistantChatPane: answer actions", () => {
  it("copies the answer as Markdown and says Copied", async () => {
    const { user } = renderPane(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "Copy" }))

    expect(await navigator.clipboard.readText()).toBe(NEWTON)
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument()
  })

  it("sends a like and keeps it highlighted", async () => {
    const calls: { url: string; body: unknown }[] = []
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages/:seq/feedback`), async ({ request }) => {
        calls.push({ url: new URL(request.url).pathname, body: await request.json() })
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderPane(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "Good answer" }))

    await waitFor(() =>
      expect(calls).toEqual([{ url: `/v1/ai/chats/${ids.chat2}/messages/2/feedback`, body: { rating: "up" } }]),
    )
    expect(screen.getByRole("button", { name: "Good answer" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Bad answer" })).toHaveAttribute("aria-pressed", "false")

    await user.click(screen.getByRole("button", { name: "Bad answer" }))

    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1]?.body).toEqual({ rating: "down" })
    expect(screen.getByRole("button", { name: "Bad answer" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Good answer" })).toHaveAttribute("aria-pressed", "false")
  })

  it("takes the like back when the feedback cannot be sent", async () => {
    server.use(http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages/:seq/feedback`), () => HttpResponse.error()))
    const { user } = renderPane(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "Good answer" }))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Good answer" })).toHaveAttribute("aria-pressed", "false"),
    )
  })

  it("regenerates the last answer and replaces it", async () => {
    let regenerated = 0
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/regenerate`), () => {
        regenerated += 1
        return HttpResponse.json({
          chat: chatHomework,
          new_messages: [message(2, "assistant", "Here is another answer.")],
          status: "done",
          usage: {
            session: { used: 1, limit: 100, resets_at: null },
            day: { used: 1, limit: 100, resets_at: "2026-10-08T00:00:00Z" },
          },
        })
      }),
    )
    const { user } = renderPane(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "Regenerate" }))

    expect(await screen.findByText("Here is another answer.")).toBeInTheDocument()
    expect(regenerated).toBe(1)
    expect(screen.queryByText("force = mass x acceleration")).not.toBeInTheDocument()
    expect(screen.getAllByRole("article")).toHaveLength(2)
  })

  it("offers regenerate on the last answer only", async () => {
    serveChat([
      message(1, "user", "First question"),
      message(2, "assistant", "First answer"),
      message(3, "user", "Second question"),
      message(4, "assistant", "Second answer"),
    ])
    renderPane(ids.chat2)

    await screen.findByText("Second answer")

    expect(screen.getAllByRole("button", { name: "Regenerate" })).toHaveLength(1)
    expect(screen.getAllByRole("button", { name: "Copy" })).toHaveLength(2)
    const first = screen.getAllByRole("article", { name: "Assistant" })[0] as HTMLElement
    expect(within(first).queryByRole("button", { name: "Regenerate" })).not.toBeInTheDocument()
    expect(within(first).getByRole("group", { name: "Answer actions" }).className).toContain("opacity-0")
  })

  it("lists Add chat to notebook and Share chat in the More menu", async () => {
    const { user } = renderPane(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "More" }))

    expect(await screen.findByRole("menuitem", { name: "Share chat" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Add chat to notebook" })).toBeInTheDocument()
  })

  it("opens the share dialog from the More menu", async () => {
    const { user } = renderPane(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "More" }))
    await user.click(await screen.findByRole("menuitem", { name: "Share chat" }))

    expect(await screen.findByRole("dialog", { name: "Share this chat" })).toBeInTheDocument()
  })
})

describe("AssistantChatPane: header", () => {
  it("renames the chat inline with Enter", async () => {
    let body: unknown
    server.use(
      http.patch(apiUrl(`/v1/ai/chats/${ids.chat2}`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...chatHomework, title: "Physics homework" })
      }),
    )
    const { user } = renderPane(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "Homework help" }))
    const input = screen.getByRole("textbox", { name: "Chat title" })
    await user.clear(input)
    await user.paste("Physics homework")
    await user.keyboard("{Enter}")

    await waitFor(() => expect(body).toEqual({ title: "Physics homework" }))
    expect(await screen.findByRole("button", { name: "Physics homework" })).toBeInTheDocument()
  })

  it("keeps the title when Escape is pressed", async () => {
    let called = false
    server.use(
      http.patch(apiUrl(`/v1/ai/chats/${ids.chat2}`), () => {
        called = true
        return HttpResponse.json(chatHomework)
      }),
    )
    const { user } = renderPane(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "Homework help" }))
    await user.paste("x")
    await user.keyboard("{Escape}")

    expect(await screen.findByRole("button", { name: "Homework help" })).toBeInTheDocument()
    expect(called).toBe(false)
  })

  it("has a back arrow to the assistant home", async () => {
    renderPane(ids.chat2)

    expect(await screen.findByRole("link", { name: "Back to chats" })).toHaveAttribute("href", "/assistant")
  })

  it("deletes from the ⋮ menu after confirmation, then leaves the chat", async () => {
    let deleted = ""
    server.use(
      http.delete(apiUrl("/v1/ai/chats/:id"), ({ params }) => {
        deleted = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderPane(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "Chat options" }))
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }))
    await user.click(await screen.findByRole("button", { name: "Delete chat" }))

    await waitFor(() => expect(deleted).toBe(ids.chat2))
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/assistant/"))
  })
})

describe("AssistantChatPane: approval cards", () => {
  it("shows tool notes and the approval card above the answer", async () => {
    renderPane(ids.chat)

    expect(await screen.findByText("Looked up your timetable")).toBeInTheDocument()
    const card = await screen.findByRole("region", { name: "Create flash card set" })
    expect(within(card).getByRole("button", { name: "Approve" })).toBeInTheDocument()
    expect(within(card).getByRole("button", { name: "Reject" })).toBeInTheDocument()
  })

  it("approves the action and shows the follow-up", async () => {
    let approved = 0
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat}/tool-calls/${ids.toolCallPending}/approve`), () => {
        approved += 1
        return HttpResponse.json(turnResultApproved)
      }),
    )
    const { user } = renderPane(ids.chat)

    await user.click(await screen.findByRole("button", { name: "Approve" }))

    expect(await screen.findByText(/with 12 cards is in your flash cards/)).toBeInTheDocument()
    expect(approved).toBe(1)
    await waitFor(() => expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument())
  })

  it("rejects with a reason", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat}/tool-calls/${ids.toolCallPending}/reject`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(turnResultRejected("make the cards shorter"))
      }),
    )
    const { user } = renderPane(ids.chat)

    await user.click(await screen.findByRole("button", { name: "Reject" }))
    await user.click(screen.getByLabelText("Reason (optional)"))
    await user.paste("make the cards shorter")
    await user.click(screen.getByRole("button", { name: "Send rejection" }))

    await waitFor(() => expect(body).toEqual({ reason: "make the cards shorter" }))
    expect(await screen.findByText("Reason: make the cards shorter")).toBeInTheDocument()
    expect(screen.getByText("Understood, I did not create the set.")).toBeInTheDocument()
  })
})

describe("AssistantChatPane: limits, stop and offline", () => {
  it("disables the composer at the limit and shows the reset time", async () => {
    server.use(http.get(apiUrl("/v1/ai/usage"), () => HttpResponse.json(usageLimitReached)))
    renderPane(ids.chat2)

    expect(await screen.findByText("Session limit reached, available again at 13:00")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled()
  })

  it("does not repeat the usage meter under the composer (it lives in the sidebar)", async () => {
    renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")

    expect(screen.queryByRole("group", { name: "Assistant usage" })).not.toBeInTheDocument()
  })

  it("locks the composer when the server answers ai/limit-reached", async () => {
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), () =>
        HttpResponse.json(
          { type: "ai/limit-reached", status: 429, title: "Limit reached" },
          { status: 429, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")
    server.use(http.get(apiUrl("/v1/ai/usage"), () => HttpResponse.json(usageLimitReached)))

    await user.click(screen.getByRole("textbox", { name: "Message" }))
    await user.paste("One more question")
    await user.click(screen.getByRole("button", { name: "Send" }))

    expect(await screen.findByText("Session limit reached, available again at 13:00")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled()
  })

  it("turns Send into Stop while the turn runs; Stop aborts and brings the draft back", async () => {
    let aborted = false
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), async ({ request }) => {
        request.signal.addEventListener("abort", () => {
          aborted = true
        })
        await delay("infinite")
        return HttpResponse.json({})
      }),
    )
    const { user } = renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")

    await user.click(screen.getByRole("textbox", { name: "Message" }))
    await user.paste("A slow question")
    await user.click(screen.getByRole("button", { name: "Send" }))
    const stop = await screen.findByRole("button", { name: "Stop" })
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("")

    await user.click(stop)

    await waitFor(() => expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("A slow question"))
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled()
    expect(screen.queryByTestId("pending-message")).not.toBeInTheDocument()
    await waitFor(() => expect(aborted).toBe(true))
  })

  it("disables the composer while offline", async () => {
    renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")

    Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true })
    fireEvent(window, new Event("offline"))
    try {
      expect(await screen.findByText("Offline")).toBeInTheDocument()
      expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled()
      expect(screen.getByRole("textbox", { name: "Message" })).toHaveAttribute("placeholder", "You are offline")
    } finally {
      Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true })
      fireEvent(window, new Event("online"))
    }
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Message" })).toBeEnabled())
  })
})

type SentBody = { text: string; file_ids: string[]; web_search?: boolean }

const usage = {
  session: { used: 1, limit: 100, resets_at: null },
  day: { used: 1, limit: 100, resets_at: "2026-10-08T00:00:00Z" },
}

/** Serves the send route: `refuse` may answer a body with an error, else the question is answered. */
function serveSend(refuse: (body: SentBody) => Response | null = () => null) {
  const bodies: SentBody[] = []
  server.use(
    http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), async ({ request }) => {
      const body = (await request.json()) as SentBody
      bodies.push(body)
      return (
        refuse(body) ??
        HttpResponse.json({
          chat: chatHomework,
          new_messages: [message(3, "user", body.text), message(4, "assistant", `You asked: ${body.text}`)],
          status: "done",
          usage,
        })
      )
    }),
  )
  return bodies
}

const quotaExceeded = () =>
  problem(429, "web-search/quota-exceeded", "No web searches left today", {
    params: { limit: 10, left: 0, needed: 1, resets_at: "2026-10-08T00:00:00Z" },
  })

/** The send-error alert with this text (the shared-chat banner is an alert too). */
async function alertWith(text: string) {
  const alert = await screen.findByText(text)
  expect(alert).toHaveAttribute("role", "alert")
  return alert
}

async function turnWebOn(user: ReturnType<typeof renderPane>["user"]) {
  await user.click(screen.getByRole("button", { name: "Add" }))
  await user.click(await screen.findByRole("menuitemcheckbox", { name: /Web search/ }))
  await screen.findByRole("button", { name: "Turn off web search" })
}

async function ask(user: ReturnType<typeof renderPane>["user"], text: string) {
  await user.click(screen.getByRole("textbox", { name: "Message" }))
  await user.paste(text)
  await user.click(screen.getByRole("button", { name: "Send" }))
}

describe("AssistantChatPane: web search", () => {
  it("sends web_search: true while the switch is on, reads the quota again and keeps the switch on", async () => {
    let quotaReads = 0
    server.use(
      http.get(apiUrl("/v1/ai/web-search"), () => {
        quotaReads += 1
        return HttpResponse.json(currentWebQuota())
      }),
    )
    const bodies = serveSend()
    const { user } = renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")
    await turnWebOn(user)

    await ask(user, "Who won the 2022 World Cup?")

    expect(await screen.findByText("You asked: Who won the 2022 World Cup?")).toBeInTheDocument()
    expect(bodies).toEqual([{ text: "Who won the 2022 World Cup?", file_ids: [], web_search: true }])
    await waitFor(() => expect(quotaReads).toBeGreaterThan(1))
    expect(screen.getByRole("button", { name: "Turn off web search" })).toBeInTheDocument()
    expect(window.sessionStorage.getItem(webSwitchKey(ids.chat2))).toBe("1")
  })

  it("leaves web_search out of the body when the switch is off", async () => {
    const bodies = serveSend()
    const { user } = renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")

    await ask(user, "What is momentum?")

    expect(await screen.findByText("You asked: What is momentum?")).toBeInTheDocument()
    expect(bodies).toEqual([{ text: "What is momentum?", file_ids: [] }])
  })

  it("keeps the draft, turns the switch off and offers Send without web search when the searches are spent", async () => {
    const bodies = serveSend((body) => (body.web_search ? quotaExceeded() : null))
    const { user } = renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")
    await turnWebOn(user)

    await ask(user, "Who won the 2022 World Cup?")

    expect(await alertWith("No web searches left today. Resets at 05:00.")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Who won the 2022 World Cup?")
    expect(screen.queryByRole("button", { name: "Turn off web search" })).not.toBeInTheDocument()
    expect(window.sessionStorage.getItem(webSwitchKey(ids.chat2))).toBeNull()

    await user.click(screen.getByRole("button", { name: "Send without web search" }))

    expect(await screen.findByText("You asked: Who won the 2022 World Cup?")).toBeInTheDocument()
    expect(bodies).toEqual([
      { text: "Who won the 2022 World Cup?", file_ids: [], web_search: true },
      { text: "Who won the 2022 World Cup?", file_ids: [] },
    ])
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("")
    expect(screen.queryByText("No web searches left today. Resets at 05:00.")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Send without web search" })).not.toBeInTheDocument()
  })

  it("shows the unavailable message with the same way out", async () => {
    serveSend((body) => (body.web_search ? problem(503, "web-search/unavailable", "Web search is down") : null))
    const { user } = renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")
    await turnWebOn(user)

    await ask(user, "Latest news?")

    expect(await alertWith("Web search is not available right now.")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Latest news?")
    expect(screen.getByRole("button", { name: "Send without web search" })).toBeInTheDocument()
  })

  it("hides the switch when the server turned web search off", async () => {
    serveSend((body) => {
      if (!body.web_search) return null
      setWebQuota(webQuotaDisabled)
      return problem(404, "web-search/disabled", "Web search is turned off")
    })
    const { user } = renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")
    await turnWebOn(user)

    await ask(user, "Latest news?")

    expect(await alertWith("Web search is turned off.")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Latest news?")
    await user.click(screen.getByRole("button", { name: "Add" }))
    await screen.findByRole("menuitemcheckbox", { name: "Guided learning" })
    await waitFor(() => expect(screen.queryByRole("menuitemcheckbox", { name: /Web search/ })).not.toBeInTheDocument())
    expect(screen.queryByRole("button", { name: "Turn off web search" })).not.toBeInTheDocument()
  })

  it("has no Send without web search for other errors", async () => {
    serveSend(() =>
      HttpResponse.json(
        { type: "ai/provider-error", status: 503, title: "Provider error" },
        { status: 503, headers: { "Content-Type": "application/problem+json" } },
      ),
    )
    const { user } = renderPane(ids.chat2)
    await screen.findByText("Explain Newton's second law")
    await turnWebOn(user)

    await ask(user, "Hello there")

    expect(await screen.findByText(/The assistant is not available right now/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Send without web search" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Turn off web search" })).toBeInTheDocument()
  })

  it("sends the first message from the home composer with the search it asked for", async () => {
    window.sessionStorage.setItem(
      pendingTurnKey(ids.chat2),
      JSON.stringify({ text: "Who won the 2022 World Cup?", file_ids: [], web: true }),
    )
    const bodies = serveSend()
    renderPane(ids.chat2)

    expect(await screen.findByText("You asked: Who won the 2022 World Cup?")).toBeInTheDocument()
    expect(bodies).toEqual([{ text: "Who won the 2022 World Cup?", file_ids: [], web_search: true }])
  })

  it("resends a first message without the search when the home turn is refused", async () => {
    window.sessionStorage.setItem(
      pendingTurnKey(ids.chat2),
      JSON.stringify({ text: "Who won the 2022 World Cup?", file_ids: [], web: true }),
    )
    window.sessionStorage.setItem(webSwitchKey(ids.chat2), "1")
    const bodies = serveSend((body) => (body.web_search ? quotaExceeded() : null))
    const { user } = renderPane(ids.chat2)

    await user.click(await screen.findByRole("button", { name: "Send without web search" }))

    expect(await screen.findByText("You asked: Who won the 2022 World Cup?")).toBeInTheDocument()
    expect(bodies).toEqual([
      { text: "Who won the 2022 World Cup?", file_ids: [], web_search: true },
      { text: "Who won the 2022 World Cup?", file_ids: [] },
    ])
    expect(screen.queryByRole("button", { name: "Turn off web search" })).not.toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("")
  })
})

describe("AssistantChatPane: one answer per turn", () => {
  it("shows a legacy turn stored as several messages as one answer with collapsed steps", async () => {
    serveChat([
      message(1, "user", "Что по литературе?"),
      message(2, "assistant", "Ищу предмет литературы."),
      message(3, "assistant", "Нашёл. Теперь оценки."),
      message(4, "assistant", "Ваши оценки: 5 и 4."),
    ])
    const { user } = renderPane(ids.chat2)

    expect(await screen.findByText("Ваши оценки: 5 и 4.")).toBeInTheDocument()
    expect(screen.getAllByRole("article", { name: "Assistant" })).toHaveLength(1)
    expect(screen.queryByText("Ищу предмет литературы.")).not.toBeInTheDocument()
    const toggle = screen.getByRole("button", { name: "Show the steps of this answer" })
    expect(toggle).toHaveTextContent("2 steps")

    await user.click(toggle)

    expect(screen.getByText("Ищу предмет литературы.")).toBeInTheDocument()
  })

  it("streams the answer: the deltas show live, then the stored answer replaces them", async () => {
    serveChat([message(1, "user", "Hi"), message(2, "assistant", "Hello")])
    const gate = Promise.withResolvers<void>()
    server.use(
      http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), () => {
        const encoder = new TextEncoder()
        const done = {
          chat: chatHomework,
          new_messages: [message(3, "user", "Momentum?"), message(4, "assistant", "Mass times velocity.")],
          status: "done",
          usage: {
            session: { used: 1, limit: 100, resets_at: null },
            day: { used: 1, limit: 100, resets_at: "2026-10-08T00:00:00Z" },
          },
        }
        const block = (event: string, data: unknown) =>
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            controller.enqueue(block("status", { text: "Looked up your marks" }))
            controller.enqueue(block("delta", { text: "Mass times " }))
            await gate.promise
            controller.enqueue(block("delta", { text: "velocity." }))
            controller.enqueue(block("done", done))
            controller.close()
          },
        })
        return new HttpResponse(stream, { headers: { "Content-Type": "text/event-stream" } })
      }),
    )
    const { user } = renderPane(ids.chat2)
    await screen.findByText("Hello")

    await user.click(screen.getByRole("textbox", { name: "Message" }))
    await user.paste("Momentum?")
    await user.click(screen.getByRole("button", { name: "Send" }))

    expect(await screen.findByTestId("pending-answer")).toHaveTextContent("Mass times")
    gate.resolve()
    expect(await screen.findByText("Mass times velocity.")).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByTestId("pending-answer")).not.toBeInTheDocument())
  })
})
