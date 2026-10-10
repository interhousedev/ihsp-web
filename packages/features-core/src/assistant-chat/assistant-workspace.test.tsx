import { describe, expect, it } from "bun:test"
import { apiUrl, ids, nbIds, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { AssistantWorkspace } from "./assistant-workspace"
import { pendingTurnKey } from "./pending-turn"
import { SIDEBAR_STORAGE_KEY } from "./use-sidebar-collapsed"

allowSlowRenders()

/** Base UI keeps `pointer-events: none` on the parent of an open sub-menu; real pointers are not blocked by it. */
const loose = userEvent.setup({ pointerEventsCheck: 0 })

function renderWorkspace(route = "/assistant/") {
  return renderNotebook(<AssistantWorkspace assistant="student" basePath="/assistant" />, { route })
}

// `next/link` drops the trailing slash outside the static export, which sets `trailingSlash`.
const QUERY = "?id="

const GREETING = /^(Hello, |What shall we study today, |Ready when you are, |How can I help, )/

describe("AssistantWorkspace: home", () => {
  it("greets the student by first name and shows four of the six chips", async () => {
    renderWorkspace()

    const greeting = await screen.findByRole("heading", { level: 2, name: GREETING })
    expect(greeting).toHaveTextContent("Aleksey")
    const chips = within(screen.getByRole("list", { name: "Suggestions" })).getAllByRole("button")
    expect(chips.map((chip) => chip.textContent)).toEqual(["Explain", "Flash cards", "Quiz", "Conspect"])
  })

  it("rotates the chips on the next visit", async () => {
    const first = renderWorkspace()
    await screen.findByRole("list", { name: "Suggestions" })
    first.unmount()

    renderWorkspace()

    const chips = within(await screen.findByRole("list", { name: "Suggestions" })).getAllByRole("button")
    expect(chips.map((chip) => chip.textContent)).toEqual(["Flash cards", "Quiz", "Conspect", "Mind map"])
  })

  it("puts the command chip into the composer without sending it", async () => {
    let created = 0
    server.use(
      http.post(apiUrl("/v1/ai/chats"), () => {
        created += 1
        return HttpResponse.json({})
      }),
    )
    const { user } = renderWorkspace()

    await user.click(await screen.findByRole("button", { name: "Quiz" }))

    expect(document.querySelector('[data-slash-chip="quiz"]')).not.toBeNull()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("")
    expect(created).toBe(0)
    expect(testRouter.push).not.toHaveBeenCalled()
  })

  it("creates the chat with the chosen tier and opens it with the text carried over", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/ai/chats"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({
          id: ids.chat2,
          assistant: "student",
          title: "New chat",
          last_message_at: "2026-10-07T05:12:00Z",
          pending_approvals: 0,
        })
      }),
    )
    const { user } = renderWorkspace()

    await user.click(await screen.findByRole("button", { name: "Answer mode: Fast" }))
    await user.click(await screen.findByRole("menuitemradio", { name: "Smart" }))
    await user.click(screen.getByRole("textbox", { name: "Message" }))
    await user.paste("Explain vectors")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith(`/assistant/chat/?id=${ids.chat2}`))
    expect(body).toEqual({ assistant: "student", tier: "smart" })
    expect(JSON.parse(window.sessionStorage.getItem(pendingTurnKey(ids.chat2)) ?? "null")).toEqual({
      text: "Explain vectors",
      file_ids: [],
    })
  })

  it("carries the web switch to the new chat with the first message", async () => {
    server.use(
      http.post(apiUrl("/v1/ai/chats"), () =>
        HttpResponse.json({
          id: ids.chat2,
          assistant: "student",
          title: "New chat",
          last_message_at: "2026-10-07T05:12:00Z",
          pending_approvals: 0,
        }),
      ),
    )
    const { user } = renderWorkspace()

    await user.click(await screen.findByRole("button", { name: "Add" }))
    await user.click(await screen.findByRole("menuitemcheckbox", { name: /Web search/ }))
    expect(await screen.findByRole("button", { name: "Turn off web search" })).toBeInTheDocument()
    expect(window.sessionStorage.getItem("ihsp.assistant.web.home")).toBe("1")
    await user.click(screen.getByRole("textbox", { name: "Message" }))
    await user.paste("Who won the 2022 World Cup?")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith(`/assistant/chat/?id=${ids.chat2}`))
    expect(JSON.parse(window.sessionStorage.getItem(pendingTurnKey(ids.chat2)) ?? "null")).toEqual({
      text: "Who won the 2022 World Cup?",
      file_ids: [],
      web: true,
    })
    expect(window.sessionStorage.getItem(`ihsp.assistant.web.${ids.chat2}`)).toBe("1")
  })

  it("keeps the draft and shows the error when the chat cannot be created", async () => {
    server.use(
      http.post(apiUrl("/v1/ai/chats"), () =>
        HttpResponse.json(
          { type: "ai/provider-error", status: 503, title: "Provider error" },
          { status: 503, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderWorkspace()

    await user.click(await screen.findByRole("textbox", { name: "Message" }))
    await user.paste("Hello there")
    await user.click(screen.getByRole("button", { name: "Send" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/The assistant is not available right now/)
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Hello there")
    expect(testRouter.push).not.toHaveBeenCalled()
  })
})

describe("AssistantWorkspace: sidebar", () => {
  it("lists the recent chats and notebooks", async () => {
    renderWorkspace()

    const nav = await screen.findByRole("navigation", { name: "Chats and notebooks" })
    expect(await within(nav).findByRole("link", { name: /^Kinematics revision/ })).toHaveAttribute(
      "href",
      `/assistant/chat${QUERY}${ids.chat}`,
    )
    expect(within(nav).getByRole("link", { name: "Homework help" })).toBeInTheDocument()
    expect(within(nav).queryByText("Weekly attendance")).not.toBeInTheDocument()
    expect(await within(nav).findByRole("link", { name: /World history/ })).toHaveAttribute(
      "href",
      `/notebooks/view${QUERY}${nbIds.notebookPinned}`,
    )
    expect(within(nav).getByRole("link", { name: /Photosynthesis/ })).toBeInTheDocument()
    expect(within(nav).getByRole("link", { name: "All notebooks" })).toHaveAttribute("href", "/notebooks")
    expect(within(nav).getByRole("link", { name: "New chat" })).toHaveAttribute("href", "/assistant")
  })

  it("marks the open chat and shows a dot for a chat with an action waiting", async () => {
    renderWorkspace(`/assistant/chat/?id=${ids.chat2}`)

    const nav = await screen.findByRole("navigation", { name: "Chats and notebooks" })
    expect(await within(nav).findByRole("link", { name: "Homework help" })).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("link", { name: /^Kinematics revision/ })).not.toHaveAttribute("aria-current")
    expect(within(nav).getByRole("img", { name: "1 action waiting" })).toBeInTheDocument()
  })

  it("marks the open notebook", async () => {
    renderWorkspace(`/notebooks/view/?id=${nbIds.notebook}`)

    const nav = await screen.findByRole("navigation", { name: "Chats and notebooks" })
    expect(await within(nav).findByRole("link", { name: /Photosynthesis/ })).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("link", { name: /World history/ })).not.toHaveAttribute("aria-current")
  })

  it("creates a notebook and opens it ready for sources", async () => {
    const { user } = renderWorkspace()

    await user.click(await screen.findByRole("button", { name: "New notebook" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledTimes(1))
    const target = testRouter.push.mock.calls[0]?.[0] ?? ""
    expect(target).toMatch(/^\/notebooks\/view\/\?id=.+&add=1$/)
  })

  it("shows the first 20 chats and 20 more on Show more", async () => {
    const chats = Array.from({ length: 45 }, (_, index) => ({
      id: `00000010-0000-4000-8000-${String(index).padStart(12, "0")}`,
      assistant: "student",
      title: `Chat number ${index + 1}`,
      last_message_at: "2026-10-07T04:50:00Z",
      pending_approvals: 0,
    }))
    server.use(http.get(apiUrl("/v1/ai/chats"), () => HttpResponse.json({ items: chats, next_cursor: null })))
    const { user } = renderWorkspace()

    expect(await screen.findByText("Chat number 20")).toBeInTheDocument()
    expect(screen.queryByText("Chat number 21")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Show more" }))

    expect(await screen.findByText("Chat number 40")).toBeInTheDocument()
    expect(screen.queryByText("Chat number 41")).not.toBeInTheDocument()
  })

  it("says so when there are no chats", async () => {
    server.use(http.get(apiUrl("/v1/ai/chats"), () => HttpResponse.json({ items: [], next_cursor: null })))
    renderWorkspace()

    expect(await screen.findByText("No chats yet. Ask your first question.")).toBeInTheDocument()
  })

  it("shows an error with a retry when the chats cannot be loaded", async () => {
    server.use(http.get(apiUrl("/v1/ai/chats"), () => HttpResponse.error()))
    renderWorkspace()

    const nav = await screen.findByRole("navigation", { name: "Chats and notebooks" })
    expect(await within(nav).findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  it("renames a chat from its menu", async () => {
    let body: unknown
    server.use(
      http.patch(apiUrl(`/v1/ai/chats/${ids.chat2}`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({
          id: ids.chat2,
          assistant: "student",
          title: "Physics homework",
          last_message_at: "2026-10-05T17:20:00Z",
          pending_approvals: 0,
        })
      }),
    )
    const { user } = renderWorkspace()

    await user.click(await screen.findByRole("button", { name: "Options for Homework help" }))
    await user.click(await screen.findByRole("menuitem", { name: "Rename" }))
    const input = await screen.findByLabelText("Title")
    await user.clear(input)
    await user.click(input)
    await user.paste("Physics homework")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(body).toEqual({ title: "Physics homework" }))
    expect(await screen.findByRole("link", { name: "Physics homework" })).toBeInTheDocument()
  })

  it("deletes a chat from its menu after confirmation and leaves it when it was open", async () => {
    let deleted = ""
    server.use(
      http.delete(apiUrl("/v1/ai/chats/:id"), ({ params }) => {
        deleted = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderWorkspace(`/assistant/chat/?id=${ids.chat2}`)

    await user.click(await screen.findByRole("button", { name: "Options for Homework help" }))
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }))
    await user.click(await screen.findByRole("button", { name: "Delete chat" }))

    await waitFor(() => expect(deleted).toBe(ids.chat2))
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/assistant/"))
  })

  it("opens the share dialog from the chat menu", async () => {
    const { user } = renderWorkspace()

    await user.click(await screen.findByRole("button", { name: "Options for Homework help" }))
    await user.click(await screen.findByRole("menuitem", { name: "Share" }))

    expect(await screen.findByRole("dialog", { name: "Share this chat" })).toBeInTheDocument()
  })

  it("adds a chat to a notebook from its menu", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ items: [{ id: "s-1" }], rejected: [] }, { status: 201 })
      }),
    )
    const { user } = renderWorkspace()

    await user.click(await screen.findByRole("button", { name: "Options for Homework help" }))
    await user.click(await screen.findByRole("menuitem", { name: "Add to notebook" }))
    await loose.click(await screen.findByRole("menuitem", { name: /Photosynthesis/ }))

    await waitFor(() => expect(body).toEqual({ items: [{ kind: "chat", chat_id: ids.chat2 }] }))
  })

  it("shows the usage once in the sidebar and in a compact popover from the top bar", async () => {
    const { user } = renderWorkspace()

    const sidebar = await screen.findByRole("group", { name: "Assistant usage" })
    expect(within(sidebar).getByText("12k / 100k")).toBeInTheDocument()
    expect(screen.getAllByRole("group", { name: "Assistant usage" })).toHaveLength(1)

    await user.click(await screen.findByRole("button", { name: "Assistant usage, 16% used" }))

    expect(await screen.findAllByRole("group", { name: "Assistant usage" })).toHaveLength(2)
  })

  it("collapses to a button that brings the sidebar back, and remembers the choice", async () => {
    const { user, unmount } = renderWorkspace()

    await user.click(await screen.findByRole("button", { name: "Collapse the sidebar" }))

    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("collapsed")
    expect(screen.queryByRole("button", { name: "Collapse the sidebar" })).not.toBeInTheDocument()
    unmount()

    const second = renderWorkspace()
    await second.user.click(await screen.findByRole("button", { name: "Open the sidebar" }))
    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBeNull()
    expect(await screen.findByRole("button", { name: "Collapse the sidebar" })).toBeInTheDocument()
  })

  it("opens the sidebar as a sheet from the history button", async () => {
    const { user } = renderWorkspace()

    await user.click(await screen.findByRole("button", { name: "Chat history" }))

    const sheet = await screen.findByRole("dialog", { name: "Chats and notebooks" })
    const link = await within(sheet).findByRole("link", { name: "Homework help" })
    await user.click(link)
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Chats and notebooks" })).not.toBeInTheDocument())
  })

  it("focuses the composer on the / key", async () => {
    const { user } = renderWorkspace()
    await screen.findByRole("textbox", { name: "Message" })
    screen.getByRole("link", { name: "New chat" }).focus()

    await user.keyboard("/")

    expect(screen.getByRole("textbox", { name: "Message" })).toHaveFocus()
  })
})
