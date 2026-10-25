import { describe, expect, it } from "bun:test"
import { nbMessageAssistant, nbMessageUser } from "@ihsp/test-utils"
import { abortable } from "./abortable"
import { answerIsStored, lastSeq, optimisticUserMessage, questionIsPending, type PendingTurn } from "./pending-turn"

const base: PendingTurn = {
  id: 1,
  kind: "send",
  userText: "Why?",
  assistantText: "",
  citations: [],
  web: [],
  stopped: false,
  baselineSeq: 2,
  replaced: null,
}

const history = [nbMessageUser, nbMessageAssistant]
const storedUser = { ...nbMessageUser, id: "u3", seq: 3 }
const storedAssistant = { ...nbMessageAssistant, id: "a4", seq: 4 }

describe("pending turn", () => {
  it("knows the highest seq of a history", () => {
    expect(lastSeq([])).toBe(0)
    expect(lastSeq(history)).toBe(2)
  })

  it("draws the question until the history holds a newer user message", () => {
    expect(questionIsPending(history, base)).toBe(true)
    expect(questionIsPending([...history, storedUser], base)).toBe(false)
    expect(questionIsPending(history, { ...base, userText: null })).toBe(false)
  })

  it("draws the answer until the history holds a newer assistant message", () => {
    expect(answerIsStored(history, base)).toBe(false)
    expect(answerIsStored([...history, storedUser], base)).toBe(false)
    expect(answerIsStored([...history, storedUser, storedAssistant], base)).toBe(true)
  })

  it("treats a regenerated answer as stored when another message has the seq of the replaced one", () => {
    const regenerate: PendingTurn = {
      ...base,
      kind: "regenerate",
      userText: null,
      replaced: { id: nbMessageAssistant.id, seq: nbMessageAssistant.seq },
    }

    expect(answerIsStored(history, regenerate)).toBe(false)
    expect(answerIsStored([nbMessageUser, { ...nbMessageAssistant, id: "fresh" }], regenerate)).toBe(true)
    // The old answer was deleted but no new one was stored (a stop before the first token).
    expect(answerIsStored([nbMessageUser], regenerate)).toBe(false)
  })

  it("builds the user message to cache when the final event only carries the answer", () => {
    const message = optimisticUserMessage("u3", 3, "Why?")

    expect(message).toMatchObject({ id: "u3", seq: 3, role: "user", text: "Why?", citations: [], feedback: null })
  })
})

async function* numbers(): AsyncGenerator<number> {
  yield 1
  yield 2
}

describe("abortable", () => {
  it("passes the items through", async () => {
    const seen: number[] = []
    for await (const item of abortable(numbers(), new AbortController().signal)) seen.push(item)

    expect(seen).toEqual([1, 2])
  })

  it("fails with an AbortError while a read is still waiting", async () => {
    const never = (async function* () {
      await new Promise(() => undefined)
      yield 1
    })()
    const controller = new AbortController()
    const result = (async () => {
      for await (const _item of abortable(never, controller.signal)) {
        // nothing arrives
      }
    })()

    controller.abort()

    await expect(result).rejects.toMatchObject({ name: "AbortError" })
  })

  it("fails at once when the signal is already aborted", async () => {
    const controller = new AbortController()
    controller.abort()

    const result = (async () => {
      for await (const _item of abortable(numbers(), controller.signal)) {
        // not reached
      }
    })()

    await expect(result).rejects.toMatchObject({ name: "AbortError" })
  })
})
