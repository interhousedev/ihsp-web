import { describe, expect, it } from "bun:test"
import { chatDetailPending, toolCallPending, turnResultApproved, turnResultFor } from "@ihsp/test-utils"
import { applyTurn } from "./apply-turn"

describe("applyTurn", () => {
  it("appends the new messages of a turn in order", () => {
    const result = applyTurn(chatDetailPending, turnResultFor(chatDetailPending, "Hello", 3))

    expect(result.messages.map((message) => message.seq)).toEqual([1, 2, 3, 4])
    expect(result.messages[2]?.text).toBe("Hello")
  })

  it("updates an older tool call when an approval finished it", () => {
    const result = applyTurn(chatDetailPending, turnResultApproved)

    const oldCall = result.messages[1]?.tool_calls.find((call) => call.id === toolCallPending.id)
    expect(oldCall?.status).toBe("done")
    expect(result.pending_approvals).toBe(0)
  })

  it("replaces a message that comes back with the same seq", () => {
    const edited = { ...chatDetailPending.messages[1]!, text: "Updated" }
    const turn = { ...turnResultFor(chatDetailPending, "x"), new_messages: [edited] }

    const result = applyTurn(chatDetailPending, turn)

    expect(result.messages).toHaveLength(2)
    expect(result.messages[1]?.text).toBe("Updated")
  })
})
