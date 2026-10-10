import { describe, expect, it, spyOn } from "bun:test"
import { getNotebookSources, keys, type AddSourcesResult } from "@ihsp/api"
import {
  apiUrl,
  nbIds,
  nbMessageAssistant,
  nbMessageAssistantUngrounded,
  nbMessageUser,
  notebookDetail,
  notebookEmptyDetail,
  notebookTurn,
  notebookUsageLimitReached,
  server,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { allowSlowRenders } from "../test-support"
import type { AskRequest } from "../types"
import { ask, chatUrl, enter, messageField, renderChat, seedHistory } from "./chat-test-support"
import { draftKey } from "./composer-draft"

allowSlowRenders()

describe("NotebookChat: top block", () => {
  it("shows the emoji, title, source count, summary and suggested questions", async () => {
    await renderChat()

    expect(await screen.findByRole("heading", { name: "Photosynthesis" })).toBeInTheDocument()
    expect(screen.getByText(/3 sources · /)).toBeInTheDocument()
    expect(screen.getByText(/chloroplasts/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Which factors limit photosynthesis?" })).toBeInTheDocument()
  })

  it("shows only the top block when the chat is empty", async () => {
    seedHistory([])
    await renderChat()

    await screen.findByRole("heading", { name: "Photosynthesis" })
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument())
    expect(screen.queryByRole("article")).not.toBeInTheDocument()
  })

  it("says the summary is being prepared while there is none", async () => {
    seedHistory([])
    await renderChat({ notebook: { ...notebookDetail, summary: null, summary_status: "building" } })

    expect(await screen.findByText("Preparing the summary…")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Which factors limit photosynthesis?" })).not.toBeInTheDocument()
  })

  it("shows no summary at all when the notebook has no sources", async () => {
    seedHistory([])
    await renderChat({ notebook: notebookEmptyDetail })

    await screen.findByRole("heading", { name: "Untitled notebook" })
    expect(screen.queryByText("Preparing the summary…")).not.toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Summary" })).not.toBeInTheDocument()
  })

  it("saves the summary as a note source", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ items: [], rejected: [] } satisfies AddSourcesResult, { status: 201 })
      }),
    )
    const success = spyOn(toast, "success").mockImplementation(() => "")
    const { user } = await renderChat()
    const summary = await screen.findByRole("region", { name: "Summary" })

    await user.click(within(summary).getByRole("button", { name: "Save to note" }))

    await waitFor(() => expect(success).toHaveBeenCalledWith("Saved to notes"))
    expect(body).toEqual({
      items: [{ kind: "note", title: "Photosynthesis", body_md: notebookDetail.summary?.summary }],
    })
  })

  it("copies the summary and marks a thumb", async () => {
    const { user } = await renderChat()
    const summary = await screen.findByRole("region", { name: "Summary" })

    await user.click(within(summary).getByRole("button", { name: "Copy" }))
    await waitFor(async () => expect(await navigator.clipboard.readText()).toContain("chloroplasts"))

    const up = within(summary).getByRole("button", { name: "Good answer" })
    await user.click(up)
    expect(up).toHaveAttribute("aria-pressed", "true")
  })

  it("sends a suggested question", async () => {
    let sent: unknown
    server.use(
      http.post(chatUrl("/messages"), async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(notebookTurn("Which factors limit photosynthesis?", { userSeq: 3 }))
      }),
    )
    const { user } = await renderChat()

    await user.click(await screen.findByRole("button", { name: "Which factors limit photosynthesis?" }))

    await waitFor(() => expect(sent).toEqual({ text: "Which factors limit photosynthesis?" }))
  })
})

describe("NotebookChat: messages", () => {
  it("renders a question bubble and a cited answer with a chip per marker", async () => {
    await renderChat()

    const answer = await screen.findByRole("article", { name: "Assistant" })
    expect(
      within(screen.getByRole("article", { name: "You" })).getByText("What is the Calvin cycle?"),
    ).toBeInTheDocument()
    // ⟦1⟧ gives one chip, ⟦1,2⟧ gives two.
    expect(within(answer).getAllByRole("button", { name: /Source 1: Biology 10\.pdf/ })).toHaveLength(2)
    expect(within(answer).getAllByRole("button", { name: /Source 2: Lesson 5/ })).toHaveLength(1)
    expect(within(answer).getByText(/does not need light directly/)).toBeInTheDocument()
  })

  it("clips a long question and expands it with the chevron", async () => {
    seedHistory([{ ...nbMessageUser, text: "line\n".repeat(8) }, nbMessageAssistant])
    const { user } = await renderChat()

    const more = await within(await screen.findByRole("article", { name: "You" })).findByRole("button", {
      name: "Show more",
    })
    expect(more).toHaveAttribute("aria-expanded", "false")
    await user.click(more)
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true")
  })

  it("shows the quiet line when the answer has no citations", async () => {
    seedHistory([nbMessageUser, nbMessageAssistantUngrounded])
    await renderChat()

    expect(await screen.findByText("This answer has no citations. Check it against your sources.")).toBeInTheDocument()
  })

  it("does not show the quiet line for a cited answer, and shows the retrieval line when asked", async () => {
    seedHistory([nbMessageUser, { ...nbMessageAssistant, retrieval: true }])
    await renderChat()

    expect(await screen.findByText("Based on the most relevant parts of large sources.")).toBeInTheDocument()
    expect(screen.queryByText(/has no citations/)).not.toBeInTheDocument()
  })

  it("sends a follow-up chip of the latest answer", async () => {
    let sent: unknown
    server.use(
      http.post(chatUrl("/messages"), async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(notebookTurn("Where does it happen?"))
      }),
    )
    const { user } = await renderChat()

    await user.click(await screen.findByRole("button", { name: "Where does it happen?" }))

    await waitFor(() => expect(sent).toEqual({ text: "Where does it happen?" }))
    // The answer of the JSON fallback joins the history.
    await waitFor(() => expect(screen.getAllByRole("article", { name: "Assistant" })).toHaveLength(2))
  })

  it("offers follow-ups, quick actions and Regenerate only under the latest answer", async () => {
    seedHistory([
      nbMessageUser,
      nbMessageAssistant,
      { ...nbMessageUser, id: "u2", seq: 3, text: "Second?" },
      { ...nbMessageAssistant, id: "a2", seq: 4, followups: ["Only for the last one"] },
    ])
    await renderChat()

    expect(await screen.findByRole("button", { name: "Only for the last one" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Where does it happen?" })).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Regenerate" })).toHaveLength(1)
    expect(screen.getAllByRole("button", { name: "Quiz" })).toHaveLength(1)
  })
})

describe("NotebookChat: answer actions", () => {
  it("saves an answer to a note source", async () => {
    const success = spyOn(toast, "success").mockImplementation(() => "")
    const { user } = await renderChat()
    const answer = await screen.findByRole("article", { name: "Assistant" })

    await user.click(within(answer).getByRole("button", { name: "Save to note" }))

    await waitFor(() => expect(success).toHaveBeenCalledWith("Saved to notes"))
    const sources = await getNotebookSources(nbIds.notebook)
    expect(sources.some((source) => source.kind === "note")).toBe(true)
  })

  it("copies the answer with [1][2] instead of the markers", async () => {
    const { user } = await renderChat()
    const answer = await screen.findByRole("article", { name: "Assistant" })

    await user.click(within(answer).getByRole("button", { name: "Copy" }))

    await waitFor(async () => {
      const copied = await navigator.clipboard.readText()
      expect(copied).toContain("carbon dioxide [1].")
      expect(copied).toContain("directly [1][2].")
      expect(copied).not.toContain("⟦")
    })
  })

  it("rates the answer and keeps the choice highlighted", async () => {
    let body: unknown
    server.use(
      http.post(chatUrl(`/messages/${nbIds.assistantMessage}/feedback`), async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = await renderChat()
    const answer = await screen.findByRole("article", { name: "Assistant" })

    await user.click(within(answer).getByRole("button", { name: "Bad answer" }))

    await waitFor(() =>
      expect(within(answer).getByRole("button", { name: "Bad answer" })).toHaveAttribute("aria-pressed", "true"),
    )
    expect(body).toEqual({ rating: "down" })
    expect(within(answer).getByRole("button", { name: "Good answer" })).toHaveAttribute("aria-pressed", "false")
  })

  it("starts a quick action with the default body and links to Studio", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(
          {
            id: "new-map",
            notebook_id: nbIds.notebook,
            kind: "mind_map",
            format: null,
            title: "",
            status: "queued",
            error: null,
            options: {},
            prompt: null,
            source_count: 3,
            sampled: false,
            unread: false,
            progress: null,
            has_assets: false,
            parent_id: null,
            flashcard_set_id: null,
            created_at: "2026-10-07T05:00:00Z",
            finished_at: null,
          },
          { status: 202 },
        )
      }),
    )
    const { user, actions } = await renderChat()

    await user.click(await screen.findByRole("button", { name: "Mind map" }))

    await waitFor(() => expect(body).toEqual({ kind: "mind_map", options: { detail: "overview" } }))
    expect(await screen.findByText("“Mind map” is being created.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Open Studio" }))
    expect(actions.showTab).toHaveBeenCalledWith("studio")
  })

  it("switches the quick action notice to ready once the item is done", async () => {
    const item = {
      id: "new-map",
      notebook_id: nbIds.notebook,
      kind: "mind_map",
      format: null,
      title: "Map",
      status: "queued",
      error: null,
      options: {},
      prompt: null,
      source_count: 3,
      sampled: false,
      unread: false,
      progress: null,
      has_assets: false,
      parent_id: null,
      flashcard_set_id: null,
      created_at: "2026-10-07T05:00:00Z",
      finished_at: null,
    }
    let status = "queued"
    let posted = false
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts`), () => {
        posted = true
        return HttpResponse.json(item, { status: 202 })
      }),
      http.get(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts`), () =>
        HttpResponse.json(posted ? [{ ...item, status }] : []),
      ),
    )
    const { user, queryClient } = await renderChat()

    await user.click(await screen.findByRole("button", { name: "Mind map" }))
    expect(await screen.findByText("“Mind map” is being created.")).toBeInTheDocument()

    status = "ready"
    await queryClient.invalidateQueries()

    expect(await screen.findByText("“Mind map” is ready.")).toBeInTheDocument()
    expect(screen.queryByText("“Mind map” is being created.")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open Studio" })).toBeInTheDocument()
  })

  it("shows the busy state of a chip while an item of its kind is being created", async () => {
    await renderChat()

    // The fixture notebook has a quiz that is still being written.
    const quiz = await screen.findByRole("button", { name: "Quiz" })
    expect(quiz).toBeDisabled()
    expect(quiz).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("button", { name: "Flash cards" })).toBeEnabled()
  })

  it("shows the busy message of a quick action that failed", async () => {
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts`), () =>
        HttpResponse.json(
          { type: "notebooks/busy", title: "Busy", status: 409 },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = await renderChat()

    await user.click(await screen.findByRole("button", { name: "Mind map" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Three items are already being created")
  })
})

describe("NotebookChat: composer", () => {
  it("shows the source counter and opens the Sources panel from it", async () => {
    const { user, actions } = await renderChat()

    await user.click(await screen.findByRole("button", { name: "3 sources" }))

    expect(actions.showTab).toHaveBeenCalledWith("sources")
    expect(messageField()).toHaveAttribute("data-notebook-composer")
  })

  it("asks to select a source and cannot send without one", async () => {
    const { user } = await renderChat({ notebook: { ...notebookDetail, selected_source_count: 0 } })

    expect(await screen.findByRole("button", { name: "Select at least one source" })).toBeInTheDocument()
    await enter(user, "Hello")
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Which factors limit photosynthesis?" })).toBeDisabled()
  })

  it("keeps Send grey until there is text, sends on Enter and clears the field", async () => {
    server.use(http.post(chatUrl("/messages"), () => HttpResponse.json(notebookTurn("Hi there"))))
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
    await enter(user, "Hi there")
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled()
    await user.keyboard("{Enter}")

    await waitFor(() => expect(messageField()).toHaveValue(""))
    expect(await screen.findAllByText("Hi there")).not.toHaveLength(0)
  })

  it("adds a line on Enter on a touch device instead of sending", async () => {
    let sent = false
    server.use(
      http.post(chatUrl("/messages"), () => {
        sent = true
        return HttpResponse.json(notebookTurn("x"))
      }),
    )
    const matchMedia = window.matchMedia
    window.matchMedia = ((query: string) => ({
      ...matchMedia.call(window, query),
      matches: query.includes("coarse"),
    })) as typeof window.matchMedia
    try {
      const { user } = await renderChat()
      await enter(user, "touch")
      await user.keyboard("{Enter}")

      expect(sent).toBe(false)
      expect(messageField()).toHaveValue("touch\n")
    } finally {
      window.matchMedia = matchMedia
    }
  })

  it("keeps the text and does not send on Shift+Enter", async () => {
    let sent = false
    server.use(
      http.post(chatUrl("/messages"), () => {
        sent = true
        return HttpResponse.json(notebookTurn("x"))
      }),
    )
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await enter(user, "first line")
    await user.keyboard("{Shift>}{Enter}{/Shift}")

    expect(sent).toBe(false)
    expect(messageField()).toHaveValue("first line\n")
  })

  it("disables the input with the reset time when a limit is reached", async () => {
    server.use(http.get(apiUrl("/v1/notebooks/usage"), () => HttpResponse.json(notebookUsageLimitReached)))
    await renderChat()

    expect(await screen.findByText(/Daily limit reached, resets at/)).toBeInTheDocument()
    expect(messageField()).toBeDisabled()
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
  })

  it("is disabled while offline", async () => {
    Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true })
    try {
      await renderChat()

      expect(await screen.findByText("You are offline")).toBeInTheDocument()
      expect(messageField()).toBeDisabled()
    } finally {
      Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true })
    }
  })

  it("prefills the field from the draft of the assistant sidebar and removes the draft", async () => {
    window.sessionStorage.setItem(draftKey(nbIds.notebook), "What is stroma?")
    await renderChat()

    await waitFor(() => expect(messageField()).toHaveValue("What is stroma?"))
    expect(window.sessionStorage.getItem(draftKey(nbIds.notebook))).toBeNull()
  })

  it("puts the question back into the field when the server refuses it", async () => {
    server.use(
      http.post(chatUrl("/messages"), () =>
        HttpResponse.json(
          { type: "notebooks/no-sources-selected", title: "No source", status: 422 },
          { status: 422, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "Explain the light reactions")

    expect(await screen.findByRole("alert")).toHaveTextContent("Select at least one ready source first.")
    await waitFor(() => expect(messageField()).toHaveValue("Explain the light reactions"))
    expect(screen.queryByText("Explain the light reactions", { selector: "p" })).not.toBeInTheDocument()
  })
})

describe("NotebookChat: asks from other panes", () => {
  it("sends the pending ask once with its anchor and calls onAskHandled", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(chatUrl("/messages"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(notebookTurn("Explain “Calvin cycle” using my sources."))
      }),
    )
    const ask: AskRequest = {
      text: "Explain “Calvin cycle” using my sources.",
      anchor: { kind: "passages", ids: ["p1"] },
      sourceIds: [nbIds.sourceFile],
    }
    const { onAskHandled } = await renderChat({ pendingAsk: ask })

    await waitFor(() => expect(onAskHandled).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ text: ask.text, anchor: ask.anchor, source_ids: [nbIds.sourceFile] })
    // Give a duplicate send a chance to show up.
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(bodies).toHaveLength(1)
  })
})

describe("NotebookChat: under StrictMode", () => {
  it("sends a pending ask once", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(chatUrl("/messages"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(notebookTurn("Strict question"))
      }),
    )
    const { onAskHandled } = await renderChat({ strict: true, pendingAsk: { text: "Strict question" } })

    await waitFor(() => expect(bodies).toHaveLength(1))
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(bodies).toHaveLength(1)
    expect(onAskHandled).toHaveBeenCalled()
  })

  it("still prefills the draft", async () => {
    window.sessionStorage.setItem(draftKey(nbIds.notebook), "Strict draft")
    await renderChat({ strict: true })

    await waitFor(() => expect(messageField()).toHaveValue("Strict draft"))
  })
})

describe("NotebookChat: after the history is cleared", () => {
  it("shows the empty state again", async () => {
    const { queryClient } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    server.use(http.get(chatUrl(), () => HttpResponse.json({ messages: [] })))
    await queryClient.invalidateQueries({ queryKey: keys.notebooks.chat(nbIds.notebook) })

    await waitFor(() => expect(screen.queryByRole("article", { name: "Assistant" })).not.toBeInTheDocument())
    expect(screen.getByRole("heading", { name: "Photosynthesis" })).toBeInTheDocument()
  })
})
