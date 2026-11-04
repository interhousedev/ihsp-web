import { describe, expect, it } from "bun:test"
import type { AiStreamEvent, TurnResult } from "@ihsp/api"
import { aiTurnStream, apiUrl, chatHomework, ids, server } from "@ihsp/test-utils"
import { HttpResponse, http } from "msw"
import { EMPTY_LIVE, applyLiveEvent, sendStreamed } from "./stream-turn"

const result: TurnResult = {
  chat: chatHomework,
  new_messages: [
    {
      seq: 3,
      role: "assistant",
      text: "Momentum is mass times velocity.",
      file_ids: [],
      tool_calls: [],
      created_at: "2026-10-05T17:20:00Z",
      web: [],
      feedback: null,
    },
  ],
  status: "done",
  usage: {
    session: { used: 1, limit: 100, resets_at: null },
    day: { used: 1, limit: 100, resets_at: "2026-10-08T00:00:00Z" },
  },
}

describe("sendStreamed", () => {
  it("passes status, step and deltas on, then resolves with the stored result", async () => {
    server.use(http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), () => aiTurnStream(result)))
    const events: AiStreamEvent[] = []

    const turn = await sendStreamed(ids.chat2, { text: "?", file_ids: [] }, { onEvent: (e) => events.push(e) })

    expect(turn.new_messages[0]?.seq).toBe(3)
    expect(events.map((e) => e.event)).toEqual(["status", "step", "delta", "delta", "delta", "delta", "delta"])
    const live = events.reduce(applyLiveEvent, EMPTY_LIVE)
    expect(live.text).toBe("Momentum is mass times velocity.")
    expect(live.status).toBe("Thinking…")
    expect(live.steps).toHaveLength(1)
  })

  it("works with a server that answers with JSON", async () => {
    server.use(http.post(apiUrl(`/v1/ai/chats/${ids.chat2}/messages`), () => HttpResponse.json(result)))

    const turn = await sendStreamed(ids.chat2, { text: "?", file_ids: [] })

    expect(turn.status).toBe("done")
  })

  it("turns an error event into an ApiError", async () => {
    const body =
      'event: status\ndata: {"text":"x"}\n\nevent: error\ndata: {"type":"ai/provider-error","title":"down"}\n\n'
    server.use(
      http.post(
        apiUrl(`/v1/ai/chats/${ids.chat2}/messages`),
        () => new HttpResponse(body, { headers: { "Content-Type": "text/event-stream" } }),
      ),
    )

    await expect(sendStreamed(ids.chat2, { text: "?", file_ids: [] })).rejects.toMatchObject({
      type: "ai/provider-error",
    })
  })
})

describe("applyLiveEvent: round_end", () => {
  it("moves the text streamed before tool calls out of the answer; the note is a step from the server", () => {
    // The order the backend sends: the streamed note, its round end, the status and the think step it records.
    const events: AiStreamEvent[] = [
      { event: "delta", data: { text: "Ищу " } },
      { event: "delta", data: { text: "предмет." } },
      { event: "round_end", data: { text: "Ищу предмет." } },
      { event: "status", data: { text: "Ищу предмет." } },
      { event: "step", data: { id: "think-1", kind: "think", label: "Ищу предмет.", status: "done", duration_ms: 0 } },
      { event: "step", data: { id: "s1", kind: "tool", label: "get_my_subjects", status: "done", duration_ms: 40 } },
      { event: "delta", data: { text: "Готово." } },
    ]

    const live = events.reduce(applyLiveEvent, EMPTY_LIVE)

    expect(live.text).toBe("Готово.")
    expect(live.steps.map((step) => [step.kind, step.label])).toEqual([
      ["think", "Ищу предмет."],
      ["tool", "get_my_subjects"],
    ])
    expect(live.status).toBe("")
  })
})

/** The SSE body of a turn as the backend writes it: one `event:`/`data:` pair per event. */
function sse(events: AiStreamEvent[]): string {
  return events.map((event) => `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`).join("")
}

describe("replayed stream: thoughts never become answer text", () => {
  it("keeps the note before a tool call out of the answer and out of the status line", async () => {
    const note = "Сначала найду предмет."
    const wire: AiStreamEvent[] = [
      { event: "status", data: { text: "Thinking…" } },
      { event: "delta", data: { text: note } },
      { event: "round_end", data: { text: note } },
      { event: "status", data: { text: note } },
      { event: "step", data: { id: "think-1", kind: "think", label: note, status: "done", duration_ms: 0 } },
      { event: "step", data: { id: "s1", kind: "tool", label: "get_marks", status: "running" } },
      { event: "step", data: { id: "s1", kind: "tool", label: "get_marks", status: "done", duration_ms: 300 } },
      { event: "status", data: { text: "Посмотрел ваши оценки" } },
      { event: "delta", data: { text: "Ваши оценки: 5." } },
      { event: "done", data: result },
    ]
    server.use(
      http.post(
        apiUrl(`/v1/ai/chats/${ids.chat2}/messages`),
        () => new HttpResponse(sse(wire), { headers: { "Content-Type": "text/event-stream" } }),
      ),
    )
    const events: AiStreamEvent[] = []

    await sendStreamed(ids.chat2, { text: "?", file_ids: [] }, { onEvent: (e) => events.push(e) })
    const live = events.reduce(applyLiveEvent, EMPTY_LIVE)

    expect(live.text).toBe("Ваши оценки: 5.")
    expect(live.text).not.toContain(note)
    expect(live.steps.filter((step) => step.kind === "think")).toHaveLength(1)
    expect(live.steps.find((step) => step.kind === "think")?.label).toBe(note)
    expect(live.status).toBe("Посмотрел ваши оценки")
  })

  it("while the note is the latest event, the status line does not repeat it", () => {
    const note = "Сначала найду предмет."
    const wire: AiStreamEvent[] = [
      { event: "delta", data: { text: note } },
      { event: "round_end", data: { text: note } },
      { event: "status", data: { text: note } },
    ]
    const live = wire.reduce(applyLiveEvent, EMPTY_LIVE)

    expect(live.status).not.toBe(note)
    expect(live.steps).toHaveLength(0)
    expect(live.text).toBe("")
  })
})
