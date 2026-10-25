import { describe, expect, it } from "bun:test"
import type { AgentStep } from "@ihsp/api"
import { runningStep, upsertStep } from "./merge-steps"

const step = (id: string, status: AgentStep["status"] = "running"): AgentStep => ({
  id,
  kind: "retrieve",
  label: "Searched the sources",
  status,
})

describe("AI-STEPS upsertStep", () => {
  it("appends a new step and replaces an update of a known one in place", () => {
    const first = upsertStep([], step("a"))
    const second = upsertStep(first, step("b"))
    const done = upsertStep(second, step("a", "done"))

    expect(done.map((s) => [s.id, s.status])).toEqual([
      ["a", "done"],
      ["b", "running"],
    ])
  })

  it("finds the step that is still running", () => {
    expect(runningStep([step("a", "done"), step("b")])?.id).toBe("b")
    expect(runningStep([step("a", "done")])).toBeUndefined()
  })
})
