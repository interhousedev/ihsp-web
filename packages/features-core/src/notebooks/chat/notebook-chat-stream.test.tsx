import { describe, expect, it } from "bun:test"
import { type AgentStep, getNotebookChat, keys, type NotebookChatHistory, type NotebookMessage } from "@ihsp/api"
import {
  apiUrl,
  citation1,
  citation2,
  nbIds,
  nbMessageAssistant,
  nbMessageUser,
  notebookTurn,
  notebookUsage,
  server,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders } from "../test-support"
import { ask, chatUrl, controlledStream, messageField, renderChat } from "./chat-test-support"

allowSlowRenders()

const answer = (overrides: Partial<NotebookMessage> = {}): NotebookMessage => ({
  ...nbMessageAssistant,
  id: "stream-answer",
  seq: 4,
  text: "Sugar is made in the stroma ⟦1⟧. It needs ATP ⟦2⟧.",
  citations: [citation1, citation2],
  followups: ["What is ATP?"],
  ...overrides,
})

const storedQuestion = (text: string): NotebookMessage => ({ ...nbMessageUser, id: "stream-question", seq: 3, text })

function problem(status: number, type: string, params: Record<string, unknown> = {}) {
  return HttpResponse.json(
    { type, title: type, status, params },
    { status, headers: { "Content-Type": "application/problem+json" } },
  )
}

describe("NotebookChat: streaming", () => {
  it("shows the question at once, grows the answer and adds chips as their citations arrive", async () => {
    const stream = controlledStream()
    stream.install()
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "How is sugar made?")

    // The pending bubble and the thinking line show before the server said anything.
    const pending = await screen.findByText("How is sugar made?", { selector: "p" })
    expect(pending.closest("[data-pending]")).not.toBeNull()
    expect(screen.getByText("Reading your sources…")).toBeInTheDocument()
    expect(messageField()).toHaveValue("")
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument()

    stream.push("message", { id: "stream-question", seq: 3 })
    stream.push("delta", { text: "Sugar is made " })
    expect(await screen.findByText(/Sugar is made/)).toBeInTheDocument()
    expect(screen.queryByText("Reading your sources…")).not.toBeInTheDocument()

    // The marker is in the text but its citation has not arrived: no chip yet.
    stream.push("delta", { text: "inside the zebra organelle ⟦1⟧. " })
    await screen.findByText(/inside the zebra organelle/)
    const streaming = screen.getByRole("article", { name: "Assistant", busy: true })
    expect(within(streaming).queryByRole("button", { name: /Source 1/ })).not.toBeInTheDocument()

    stream.push("citation", citation1)
    expect(await within(streaming).findByRole("button", { name: /Source 1: Biology 10\.pdf/ })).toBeInTheDocument()

    stream.push("delta", { text: "It needs ATP ⟦2⟧." })
    stream.push("citation", citation2)
    expect(await within(streaming).findByRole("button", { name: /Source 2: Lesson 5/ })).toBeInTheDocument()

    stream.push("done", {
      assistant_message: answer(),
      user_message: storedQuestion("How is sugar made?"),
      usage: notebookUsage,
    })
    stream.close()

    // The stored answer replaces the streamed one: one new answer, one new question, the follow-up of the answer.
    expect(await screen.findByRole("button", { name: "What is ATP?" })).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole("article", { name: "Assistant" })).toHaveLength(2))
    expect(screen.getAllByText("How is sugar made?")).toHaveLength(1)
    expect(await screen.findByRole("button", { name: "Send" })).toBeInTheDocument()
  })

  it("keeps the question when the final event does not carry it", async () => {
    const stream = controlledStream()
    stream.install()
    const { user, queryClient } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "And the dark reactions?")
    stream.push("message", { id: "stream-question", seq: 3 })
    stream.push("delta", { text: "Short." })
    stream.push("done", {
      assistant_message: answer({ text: "Short.", citations: [], followups: [], grounded: false }),
    })
    stream.close()

    // Send comes back once the turn is over (the pending question is cleared by then).
    expect(await screen.findByRole("button", { name: "Send" })).toBeInTheDocument()
    expect(screen.getAllByRole("article", { name: "Assistant" })).toHaveLength(2)
    expect(screen.getAllByText("And the dark reactions?")).toHaveLength(1)
    expect(screen.getAllByRole("article", { name: "You" })).toHaveLength(2)
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it("collects many deltas into the final text", async () => {
    const stream = controlledStream()
    stream.install()
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "Tell me a lot")
    stream.push("message", { id: "stream-question", seq: 3 })
    const words = Array.from({ length: 300 }, (_, index) => `word${index} `)
    for (const word of words) stream.push("delta", { text: word })

    expect(await screen.findByText(/word299/)).toBeInTheDocument()
    expect(screen.getByText(/word0 word1 word2/)).toBeInTheDocument()
    stream.push("done", { assistant_message: answer({ text: words.join(""), citations: [], followups: [] }) })
    stream.close()
    await waitFor(() => expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument())
  })

  it("stops on request and keeps the partial text as a stopped answer", async () => {
    const stream = controlledStream()
    stream.install()
    let reloads = 0
    server.use(
      http.get(chatUrl(), () => {
        reloads += 1
        return HttpResponse.json({ messages: [nbMessageUser, nbMessageAssistant] })
      }),
    )
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })
    const before = reloads

    await ask(user, "Explain slowly")
    stream.push("message", { id: "stream-question", seq: 3 })
    stream.push("delta", { text: "First half of the" })
    await screen.findByText(/First half of the/)

    await user.click(screen.getByRole("button", { name: "Stop" }))

    expect(await screen.findByText("Stopped")).toBeInTheDocument()
    expect(screen.getByText(/First half of the/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument()
    await waitFor(() => expect(reloads).toBeGreaterThan(before))
    // The question stays, too, because the history does not hold it.
    expect(screen.getByText("Explain slowly", { selector: "p" })).toBeInTheDocument()
  })

  it("drops the stopped partial text once the history holds the stored answer", async () => {
    const stream = controlledStream()
    stream.install()
    const stopped = answer({ id: "stopped-answer", text: "First half of the", citations: [], stopped: true })
    let stored = false
    server.use(
      http.get(chatUrl(), () =>
        HttpResponse.json({
          messages: stored
            ? [nbMessageUser, nbMessageAssistant, storedQuestion("Explain slowly"), stopped]
            : [nbMessageUser, nbMessageAssistant],
        }),
      ),
    )
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "Explain slowly")
    stream.push("message", { id: "stream-question", seq: 3 })
    stream.push("delta", { text: "First half of the" })
    await screen.findByText(/First half of the/)
    stored = true
    await user.click(screen.getByRole("button", { name: "Stop" }))

    // One stopped answer and one question, not two of each.
    await waitFor(() => expect(screen.getAllByRole("article", { name: "Assistant" })).toHaveLength(2))
    await waitFor(() => expect(screen.getAllByText(/First half of the/)).toHaveLength(1))
    expect(screen.getAllByText("Explain slowly")).toHaveLength(1)
    expect(screen.getByText("Stopped")).toBeInTheDocument()
  })

  it("shows an error event inline and drops the partial text", async () => {
    const stream = controlledStream()
    stream.install()
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "Will this fail?")
    stream.push("message", { id: "stream-question", seq: 3 })
    stream.push("delta", { text: "Half an ans" })
    await screen.findByText(/Half an ans/)
    stream.push("error", {
      type: "notebooks/limit-reached",
      title: "Limit",
      params: { scope: "session", resets_at: "2026-10-07T08:00:00Z" },
    })
    stream.close()

    expect(await screen.findByRole("alert")).toHaveTextContent(/Session limit reached, available again at/)
    expect(screen.queryByText(/Half an ans/)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument()
  })

  it("reports a stream that ends without a final event", async () => {
    const stream = controlledStream()
    stream.install()
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "Cut off")
    stream.push("message", { id: "stream-question", seq: 3 })
    stream.push("delta", { text: "Almost" })
    stream.close()

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument()
  })

  it("shows a limit problem of the request, refreshes the usage and gives the question back", async () => {
    let usageReads = 0
    server.use(
      http.get(apiUrl("/v1/notebooks/usage"), () => {
        usageReads += 1
        return HttpResponse.json(notebookUsage)
      }),
      http.post(chatUrl("/messages"), () =>
        problem(429, "notebooks/limit-reached", { scope: "day", resets_at: "2026-10-08T00:00:00Z" }),
      ),
    )
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })
    const before = usageReads

    await ask(user, "One more question")

    expect(await screen.findByRole("alert")).toHaveTextContent(/Daily limit reached, resets at/)
    await waitFor(() => expect(usageReads).toBeGreaterThan(before))
    await waitFor(() => expect(messageField()).toHaveValue("One more question"))
  })

  it("shows the busy message when another question is running", async () => {
    server.use(http.post(chatUrl("/messages"), () => problem(409, "notebooks/busy")))
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "Again")

    expect(await screen.findByRole("alert")).toHaveTextContent(/already being created/)
  })

  it("falls back to a JSON answer when the server does not stream", async () => {
    server.use(http.post(chatUrl("/messages"), () => HttpResponse.json(notebookTurn("Plain JSON"))))
    const { user, queryClient } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "Plain JSON")

    await waitFor(() => expect(screen.getAllByRole("article", { name: "Assistant" })).toHaveLength(2))
    expect(screen.getByText("Plain JSON", { selector: "p" })).toBeInTheDocument()
    expect(queryClient.getQueryData<NotebookChatHistory>(keys.notebooks.chat(nbIds.notebook))?.messages).toHaveLength(4)
  })

  it("streams with the default mock backend and stores the turn", async () => {
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "Default backend")

    await waitFor(() => expect(screen.getAllByRole("article", { name: "Assistant" })).toHaveLength(2))
    expect(screen.getAllByRole("button", { name: /Source 1: Biology 10\.pdf/ })).toHaveLength(4)
    expect(screen.getByText("Default backend", { selector: "p" })).toBeInTheDocument()
  })
})

describe("NotebookChat: regenerate", () => {
  it("hides the old answer while the new one streams and then replaces it", async () => {
    const stream = controlledStream()
    stream.install("/regenerate")
    const { user } = await renderChat()
    const old = await screen.findByRole("article", { name: "Assistant" })
    expect(within(old).getByText(/builds sugar from carbon dioxide/)).toBeInTheDocument()

    await user.click(within(old).getByRole("button", { name: "Regenerate" }))

    await waitFor(() => expect(screen.queryByText(/builds sugar from carbon dioxide/)).not.toBeInTheDocument())
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument()
    stream.push("delta", { text: "A fresh answer " })
    expect(await screen.findByText(/A fresh answer/)).toBeInTheDocument()
    stream.push("done", {
      assistant_message: { ...nbMessageAssistant, id: "fresh", text: "A fresh answer ⟦1⟧.", citations: [citation1] },
    })
    stream.close()

    await waitFor(() => expect(screen.getByRole("button", { name: "Regenerate" })).toBeInTheDocument())
    expect(screen.getAllByRole("article", { name: "Assistant" })).toHaveLength(1)
    expect(screen.getByText(/A fresh answer/)).toBeInTheDocument()
    expect(screen.queryByText(/builds sugar from carbon dioxide/)).not.toBeInTheDocument()
  })

  it("replaces the answer with the default mock backend", async () => {
    const { user } = await renderChat()
    const old = await screen.findByRole("article", { name: "Assistant" })

    await user.click(within(old).getByRole("button", { name: "Regenerate" }))

    await waitFor(async () => {
      const history = await getNotebookChat(nbIds.notebook)
      expect(history.messages).toHaveLength(2)
      expect(history.messages[1]?.id).not.toBe(nbIds.assistantMessage)
    })
    await waitFor(() => expect(screen.getAllByRole("article", { name: "Assistant" })).toHaveLength(1))
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeInTheDocument()
  })
})

describe("NotebookChat: proposed Studio output", () => {
  const action = { kind: "quiz", options: { count: "standard", difficulty: "hard" }, prompt: "Only the Calvin cycle" }

  it("shows an action card under the answer and creates the artifact on Create", async () => {
    let body: unknown
    server.use(
      http.post(chatUrl("/messages"), () =>
        HttpResponse.json({ ...notebookTurn("Make a quiz about the Calvin cycle"), action }),
      ),
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(
          { id: "q1", notebook_id: nbIds.notebook, kind: "quiz", status: "queued" },
          { status: 202 },
        )
      }),
    )
    const { user, actions } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "Make a quiz about the Calvin cycle")

    const card = await screen.findByRole("group", { name: "Create “Quiz”?" })
    expect(within(card).getByText("Hard")).toBeInTheDocument()
    expect(within(card).getByText(/Only the Calvin cycle/)).toBeInTheDocument()

    await user.click(within(card).getByRole("button", { name: "Create" }))

    await waitFor(() => expect(body).toEqual(action))
    expect(await within(card).findByText("“Quiz” is being created.")).toBeInTheDocument()
    await user.click(within(card).getByRole("button", { name: "Open Studio" }))
    expect(actions.showTab).toHaveBeenCalledWith("studio")
  })

  it("dismisses the card on Cancel without creating anything", async () => {
    let created = false
    server.use(
      http.post(chatUrl("/messages"), () => HttpResponse.json({ ...notebookTurn("Quiz me"), action })),
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts`), () => {
        created = true
        return HttpResponse.json({}, { status: 202 })
      }),
    )
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })
    await ask(user, "Quiz me")
    const card = await screen.findByRole("group", { name: "Create “Quiz”?" })

    await user.click(within(card).getByRole("button", { name: "Cancel" }))

    expect(screen.queryByRole("group", { name: "Create “Quiz”?" })).not.toBeInTheDocument()
    expect(created).toBe(false)
  })

  it("shows the card of a streamed answer", async () => {
    const stream = controlledStream()
    stream.install()
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "Make a quiz")
    stream.push("message", { id: "stream-question", seq: 3 })
    stream.push("delta", { text: "Here is a quiz proposal." })
    stream.push("done", { assistant_message: answer({ text: "Here is a quiz proposal.", citations: [] }), action })
    stream.close()

    expect(await screen.findByRole("group", { name: "Create “Quiz”?" })).toBeInTheDocument()
  })
})

describe("AI-STEPS NotebookChat: live steps", () => {
  it("shows the running step while the answer streams and keeps the stored steps after done", async () => {
    const stream = controlledStream()
    stream.install()
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "How is sugar made?")
    const step: AgentStep = { id: "h1", kind: "retrieve", label: "Searched the sources", status: "running" }
    stream.push("message", { id: "stream-question", seq: 3 })
    stream.push("step", step)
    expect(await screen.findByText("Searching the sources…")).toBeInTheDocument()

    stream.push("step", { ...step, status: "done", duration_ms: 400 })
    stream.push("delta", { text: "Sugar is made " })
    expect(await screen.findByText("1 step")).toBeInTheDocument()

    stream.push("done", {
      assistant_message: answer({ steps: [{ ...step, status: "done", duration_ms: 400 }] }),
      user_message: storedQuestion("How is sugar made?"),
      usage: notebookUsage,
    })
    stream.close()

    await waitFor(() => expect(screen.queryByRole("article", { busy: true })).not.toBeInTheDocument())
    expect(screen.getAllByRole("button", { name: "Show the steps of this answer" }).length).toBeGreaterThan(0)
  })
})
