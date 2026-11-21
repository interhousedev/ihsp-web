import { describe, expect, it } from "bun:test"
import { deriveStages, stageFromParam, type Stages } from "./flow"

const facts = { quizDone: false, entries: 0 }
const lockedOf = (result: Stages) => result.stages.map((stage) => stage.locked)

describe("deriveStages", () => {
  it("opens only the survey for a new student", () => {
    const flow = deriveStages(facts, null)
    expect(lockedOf(flow)).toEqual([false, true, true])
    expect(flow.landing).toBe("quiz")
    expect(flow.open).toBe("quiz")
  })

  it("lands on matching after the survey while the list is empty", () => {
    const flow = deriveStages({ quizDone: true, entries: 0 }, null)
    expect(flow.landing).toBe("match")
    expect(lockedOf(flow)).toEqual([false, false, true])
  })

  it("is free once there is a list, and a returning student lands on the list", () => {
    const flow = deriveStages({ quizDone: true, entries: 3 }, null)
    expect(lockedOf(flow)).toEqual([false, false, false])
    expect(flow.landing).toBe("list")
    expect(deriveStages({ quizDone: true, entries: 3 }, "match").open).toBe("match")
    expect(deriveStages({ quizDone: true, entries: 3 }, "quiz").open).toBe("quiz")
  })

  it("falls back to the landing stage for a locked or unknown request", () => {
    expect(deriveStages({ quizDone: true, entries: 0 }, "list").open).toBe("match")
    expect(deriveStages(facts, "match").open).toBe("quiz")
    expect(deriveStages({ quizDone: true, entries: 1 }, "nonsense").open).toBe("list")
  })

  it("maps the old budget and brief addresses to the list", () => {
    expect(stageFromParam("budget")).toBe("list")
    expect(stageFromParam("brief")).toBe("list")
    expect(deriveStages({ quizDone: true, entries: 2 }, "budget").open).toBe("list")
  })
})
