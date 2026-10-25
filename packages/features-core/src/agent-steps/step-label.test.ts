import { describe, expect, it } from "bun:test"
import type { AgentStep } from "@ihsp/api"
import { formatDuration, stepLabel } from "./step-label"

const base: AgentStep = { id: "1", kind: "tool", label: "get_schedule", status: "done" }

describe("AI-STEPS stepLabel", () => {
  it("names a step by its kind, with the target when there is one", () => {
    expect(stepLabel({ ...base, kind: "read_file", target: "Essay.docx" })).toEqual({
      key: "readFile",
      values: { target: "Essay.docx" },
    })
    expect(stepLabel({ ...base, kind: "web_search" })).toEqual({ key: "webSearch", values: {} })
    expect(stepLabel({ ...base, kind: "create", target: "Cells" })).toEqual({
      key: "create",
      values: { target: "Cells" },
    })
  })

  it("names a known tool and falls back to the readable tool name", () => {
    expect(stepLabel(base)).toEqual({ key: "tool.get_schedule", values: {}, fallback: "Get schedule" })
  })

  it("uses the running form while a step is not finished", () => {
    expect(stepLabel({ ...base, kind: "retrieve", status: "running" }).key).toBe("running.retrieve")
  })
})

describe("AI-STEPS formatDuration", () => {
  it("shows seconds with one decimal under a minute, nothing when unknown", () => {
    expect(formatDuration(1234)).toBe("1.2s")
    expect(formatDuration(65_000)).toBe("1m 5s")
    expect(formatDuration(null)).toBe("")
  })
})
