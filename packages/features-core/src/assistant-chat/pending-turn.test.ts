import { describe, expect, it } from "bun:test"
import { pendingTurnKey, storePendingTurn, takePendingTurn } from "./pending-turn"

describe("pending turn", () => {
  it("hands the text, the files and the web switch to the chat page once", () => {
    storePendingTurn("chat-1", { text: "Who won?", file_ids: ["f1"], web: true })

    expect(takePendingTurn("chat-1")).toEqual({ text: "Who won?", file_ids: ["f1"], web: true })
    expect(takePendingTurn("chat-1")).toBeNull()
  })

  it("has no web flag unless the switch was on", () => {
    storePendingTurn("chat-2", { text: "Hello", file_ids: [] })

    expect(takePendingTurn("chat-2")).toEqual({ text: "Hello", file_ids: [] })
  })

  it("ignores a stored turn whose web flag is not a boolean", () => {
    window.sessionStorage.setItem(pendingTurnKey("chat-3"), JSON.stringify({ text: "Hello", file_ids: [], web: "yes" }))

    expect(takePendingTurn("chat-3")).toBeNull()
  })
})
