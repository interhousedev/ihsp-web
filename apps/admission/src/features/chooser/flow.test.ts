import { describe, expect, it } from "bun:test"
import { deriveFlow, LIST_TARGET } from "./flow"

const facts = { quizDone: false, entries: 0, budgetViewed: false }
const lockedOf = (result: ReturnType<typeof deriveFlow>) => result.steps.map((step) => step.locked)

describe("deriveFlow", () => {
  it("opens only the quiz for a new student", () => {
    const flow = deriveFlow(facts, null)
    expect(lockedOf(flow)).toEqual([false, true, true, true, true])
    expect(flow.current).toBe("quiz")
    expect(flow.open).toBe("quiz")
    expect(flow.steps[1]).toMatchObject({ blockedBy: "quiz" })
  })

  it("opens the pick once the quiz is done and the list after the first entry", () => {
    expect(deriveFlow({ ...facts, quizDone: true }, null).current).toBe("match")
    const flow = deriveFlow({ ...facts, quizDone: true, entries: 1 }, null)
    expect(flow.current).toBe("list")
    expect(lockedOf(flow)).toEqual([false, false, false, true, true])
    expect(flow.steps[3]).toMatchObject({ blockedBy: "list", missing: LIST_TARGET - 1 })
  })

  it("opens the budget at four entries and the brief once the budget is viewed", () => {
    const four = deriveFlow({ quizDone: true, entries: LIST_TARGET, budgetViewed: false }, null)
    expect(four.current).toBe("budget")
    expect(lockedOf(four)).toEqual([false, false, false, false, true])
    const viewed = deriveFlow({ quizDone: true, entries: LIST_TARGET, budgetViewed: true }, null)
    expect(viewed.current).toBe("brief")
    expect(lockedOf(viewed)).toEqual([false, false, false, false, false])
  })

  it("keeps the requested step while it is open and falls back to the current one while it is locked", () => {
    const state = { quizDone: true, entries: 1, budgetViewed: false }
    expect(deriveFlow(state, "match").open).toBe("match")
    expect(deriveFlow(state, "brief").open).toBe("list")
    expect(deriveFlow(state, "nonsense").open).toBe("list")
  })

  it("locks later steps again when the list shrinks", () => {
    const flow = deriveFlow({ quizDone: true, entries: 3, budgetViewed: true }, "brief")
    expect(flow.steps[4]).toMatchObject({ locked: true, blockedBy: "list", missing: 1 })
    expect(flow.open).toBe("list")
  })
})
