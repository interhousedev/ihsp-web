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
  it("moves the text streamed before tool calls out of the answer into a note step", () => {
    const events: AiStreamEvent[] = [
      { event: "delta", data: { text: "Ищу " } },
      { event: "delta", data: { text: "предмет." } },
      { event: "round_end", data: { text: "Ищу предмет." } },
      { event: "step", data: { id: "s1", kind: "tool", label: "get_my_subjects", status: "done" } },
      { event: "delta", data: { text: "Готово." } },
    ]

    const live = events.reduce(applyLiveEvent, EMPTY_LIVE)

    expect(live.text).toBe("Готово.")
    expect(live.steps.map((step) => [step.kind, step.label])).toEqual([
      ["think", "Ищу предмет."],
      ["tool", "get_my_subjects"],
    ])
    expect(live.status).toBe("Ищу предмет.")
  })
})
