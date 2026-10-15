import { describe, expect, it } from "bun:test"
import type { ChatMessageView, ToolCallView } from "@ihsp/api"
import { mergeAssistantTurns } from "./merge-turns"

function message(seq: number, role: "user" | "assistant", text: string, extra: Partial<ChatMessageView> = {}) {
  const base: ChatMessageView = {
    seq,
    role,
    text,
    file_ids: [],
    tool_calls: [],
    created_at: "2026-10-05T17:20:00Z",
    web: [],
    feedback: null,
  }
  return { ...base, ...extra }
}

const call = (id: string, status: ToolCallView["status"]) =>
  ({
    id,
    tool: "get_marks",
    access: "read",
    status,
    note: "",
    preview: null,
    reject_reason: null,
    expires_at: null,
  }) as ToolCallView

describe("mergeAssistantTurns", () => {
  it("shows an older answer stored as several messages as one item with the last text", () => {
    const step = { id: "s1", kind: "tool", label: "get_my_subjects", status: "done" } as const
    const merged = mergeAssistantTurns([
      message(1, "user", "Что по литературе?"),
      message(2, "assistant", "Ищу предмет.", { tool_calls: [call("c1", "done")], steps: [step] }),
      message(3, "assistant", "Нашёл. Теперь оценки.", { tool_calls: [call("c2", "done")] }),
      message(4, "assistant", "Ваши оценки: 5, 4."),
      message(5, "user", "Спасибо"),
    ])

    expect(merged.map((item) => item.seq)).toEqual([1, 4, 5])
    const answer = merged[1] as ChatMessageView
    expect(answer.text).toBe("Ваши оценки: 5, 4.")
    expect(answer.tool_calls.map((item) => item.id)).toEqual(["c1", "c2"])
    expect(answer.steps?.map((item) => item.label)).toEqual([
      "get_my_subjects",
      "Ищу предмет.",
      "Нашёл. Теперь оценки.",
    ])
    expect(answer.progress).toEqual(["Ищу предмет.", "Нашёл. Теперь оценки."])
  })

  it("keeps the newest copy of a call that an approval stored again", () => {
    const merged = mergeAssistantTurns([
      message(1, "user", "make cards"),
      message(2, "assistant", "", { tool_calls: [call("c1", "pending_approval")] }),
      message(3, "assistant", "Done.", { tool_calls: [call("c1", "done")] }),
    ])

    expect(merged[1]?.tool_calls.map((item) => item.status)).toEqual(["done"])
  })

  it("leaves single answers alone", () => {
    const messages = [message(1, "user", "hi"), message(2, "assistant", "hello")]

    expect(mergeAssistantTurns(messages)).toEqual(messages)
  })
})
