import { beforeEach, describe, expect, it } from "bun:test"
import type { ChatDetail } from "@ihsp/api"
import { apiUrl, chatDetailPending, server, userMe } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderTools } from "../utils/tools-test-utils"
import { AssistantBubble, bubbleChatKey } from "./assistant-bubble"

allowSlowRenders()

const FIRST = "0190a000-0000-7000-8000-00000000b001"
const SECOND = "0190a000-0000-7000-8000-00000000b002"

const detail = (id: string): ChatDetail => ({ ...chatDetailPending, id, title: "New chat", messages: [] })

/** `POST /v1/ai/chats` hands out FIRST, then SECOND; both chats can be read back empty. */
function useBubbleChats(): { created: () => number; remove: (id: string) => void } {
  const queue = [FIRST, SECOND]
  const gone = new Set<string>()
  let created = 0
  server.use(
    http.post(apiUrl("/v1/ai/chats"), () => {
      const id = queue[created] ?? SECOND
      created += 1
      const { messages: _messages, shared: _shared, ...item } = detail(id)
      return HttpResponse.json(item)
    }),
    http.get(apiUrl("/v1/ai/chats/:id"), ({ params }) =>
      [FIRST, SECOND].includes(String(params.id)) && !gone.has(String(params.id))
        ? HttpResponse.json(detail(String(params.id)))
        : HttpResponse.json({ type: "about:blank", title: "Not found", status: 404 }, { status: 404 }),
    ),
  )
  return { created: () => created, remove: (id) => gone.add(id) }
}

function fullPageLink(): HTMLElement {
  return screen.getByRole("link", { name: "Open in full screen" })
}

describe("AssistantBubble", () => {
  beforeEach(() => window.localStorage.clear())

  it("opens a chat, starts a new one, collapses and continues it when reopened", async () => {
    const chats = useBubbleChats()
    const { user } = renderTools(<AssistantBubble />, { route: "/" })

    const circle = screen.getByRole("button", { name: "Open the assistant" })
    expect(circle).toHaveAttribute("aria-expanded", "false")
    await user.click(circle)

    expect(screen.getByRole("dialog", { name: "Assistant" })).toBeInTheDocument()
    expect(await screen.findByText("How can I help?")).toBeInTheDocument()
    await waitFor(() =>
      expect(fullPageLink()).toHaveAttribute(
        "href",
        expect.stringMatching(new RegExp(`/assistant/chat/?\\?id=${FIRST}$`)),
      ),
    )
    expect(window.localStorage.getItem(bubbleChatKey(userMe.id))).toBe(FIRST)

    await user.click(screen.getByRole("button", { name: "New chat" }))
    await waitFor(() =>
      expect(fullPageLink()).toHaveAttribute(
        "href",
        expect.stringMatching(new RegExp(`/assistant/chat/?\\?id=${SECOND}$`)),
      ),
    )
    expect(window.localStorage.getItem(bubbleChatKey(userMe.id))).toBe(SECOND)

    await user.click(screen.getByRole("button", { name: "Collapse the assistant" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByRole("button", { name: "Open the assistant" })).toHaveFocus()

    await user.click(screen.getByRole("button", { name: "Open the assistant" }))
    await waitFor(() =>
      expect(fullPageLink()).toHaveAttribute(
        "href",
        expect.stringMatching(new RegExp(`/assistant/chat/?\\?id=${SECOND}$`)),
      ),
    )
    expect(chats.created()).toBe(2)
  })

  it("continues the chat kept on this device and collapses on Escape", async () => {
    const chats = useBubbleChats()
    window.localStorage.setItem(bubbleChatKey(userMe.id), FIRST)
    const { user } = renderTools(<AssistantBubble />, { route: "/grades/" })

    await user.click(screen.getByRole("button", { name: "Open the assistant" }))
    await waitFor(() =>
      expect(fullPageLink()).toHaveAttribute(
        "href",
        expect.stringMatching(new RegExp(`/assistant/chat/?\\?id=${FIRST}$`)),
      ),
    )
    expect(chats.created()).toBe(0)

    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("starts a new chat when the kept one is gone", async () => {
    const chats = useBubbleChats()
    window.localStorage.setItem(bubbleChatKey(userMe.id), "0190a000-0000-7000-8000-00000000dead")
    const { user } = renderTools(<AssistantBubble />, { route: "/" })

    await user.click(screen.getByRole("button", { name: "Open the assistant" }))
    await waitFor(() =>
      expect(fullPageLink()).toHaveAttribute(
        "href",
        expect.stringMatching(new RegExp(`/assistant/chat/?\\?id=${FIRST}$`)),
      ),
    )
    expect(chats.created()).toBe(1)
  })

  it("starts a new chat on reopening when the one it created was deleted meanwhile", async () => {
    const chats = useBubbleChats()
    const { user } = renderTools(<AssistantBubble />, { route: "/" })

    await user.click(screen.getByRole("button", { name: "Open the assistant" }))
    await waitFor(() =>
      expect(fullPageLink()).toHaveAttribute(
        "href",
        expect.stringMatching(new RegExp(`/assistant/chat/?\\?id=${FIRST}$`)),
      ),
    )
    await user.click(screen.getByRole("button", { name: "Collapse the assistant" }))
    chats.remove(FIRST)

    await user.click(screen.getByRole("button", { name: "Open the assistant" }))
    await waitFor(() =>
      expect(fullPageLink()).toHaveAttribute(
        "href",
        expect.stringMatching(new RegExp(`/assistant/chat/?\\?id=${SECOND}$`)),
      ),
    )
    expect(chats.created()).toBe(2)
    expect(window.localStorage.getItem(bubbleChatKey(userMe.id))).toBe(SECOND)
  })

  it("is not shown on the assistant page", () => {
    renderTools(<AssistantBubble />, { route: "/assistant/" })
    expect(screen.queryByRole("button", { name: "Open the assistant" })).not.toBeInTheDocument()
  })
})
