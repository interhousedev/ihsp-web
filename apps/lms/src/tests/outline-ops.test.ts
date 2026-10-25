import { describe, expect, it } from "bun:test"
import type { OutlineSection } from "@ihsp/api"
import {
  applyOutlineOps,
  computeDragOps,
  moveSectionOps,
  moveStepOps,
  parseDragId,
  sectionDragId,
  sectionDropId,
  stepDragId,
} from "../features/editor/utils/outline-ops"

const outline: OutlineSection[] = [
  {
    id: "s1",
    title: "Intro",
    steps: [
      { step_id: "a", title: "A" },
      { step_id: "b", title: "B" },
      { step_id: "c", title: "C" },
    ],
  },
  { id: "s2", title: "Practice", steps: [{ step_id: "d", title: "D" }] },
  { id: "s3", title: "Empty", steps: [] },
]

describe("drag ids", () => {
  it("round-trip kind and id", () => {
    expect(parseDragId(stepDragId("a"))).toEqual({ kind: "step", id: "a" })
    expect(parseDragId(sectionDragId("s1"))).toEqual({ kind: "section", id: "s1" })
    expect(parseDragId(sectionDropId("s3"))).toEqual({ kind: "drop", id: "s3" })
    expect(parseDragId("nope")).toBeNull()
    expect(parseDragId(null)).toBeNull()
  })
})

describe("computeDragOps", () => {
  it("moves a step within its section to the index of the step it is dropped on", () => {
    expect(computeDragOps(outline, stepDragId("a"), stepDragId("c"))).toEqual([
      { op: "move_step", step_id: "a", to_section_id: "s1", position: 2 },
    ])
    expect(computeDragOps(outline, stepDragId("c"), stepDragId("a"))).toEqual([
      { op: "move_step", step_id: "c", to_section_id: "s1", position: 0 },
    ])
  })

  it("moves a step into another section before the step it is dropped on", () => {
    expect(computeDragOps(outline, stepDragId("b"), stepDragId("d"))).toEqual([
      { op: "move_step", step_id: "b", to_section_id: "s2", position: 0 },
    ])
  })

  it("appends to a section when dropped on the end of its list, also when it is empty", () => {
    expect(computeDragOps(outline, stepDragId("a"), sectionDropId("s3"))).toEqual([
      { op: "move_step", step_id: "a", to_section_id: "s3", position: 0 },
    ])
    expect(computeDragOps(outline, stepDragId("a"), sectionDropId("s2"))).toEqual([
      { op: "move_step", step_id: "a", to_section_id: "s2", position: 1 },
    ])
    expect(computeDragOps(outline, stepDragId("a"), sectionDropId("s1"))).toEqual([
      { op: "move_step", step_id: "a", to_section_id: "s1", position: 2 },
    ])
  })

  it("does nothing when the step stays where it is", () => {
    expect(computeDragOps(outline, stepDragId("b"), stepDragId("b"))).toEqual([])
    expect(computeDragOps(outline, stepDragId("c"), sectionDropId("s1"))).toEqual([])
    expect(computeDragOps(outline, stepDragId("a"), null)).toEqual([])
  })

  it("moves sections", () => {
    expect(computeDragOps(outline, sectionDragId("s1"), sectionDragId("s2"))).toEqual([
      { op: "move_section", section_id: "s1", position: 1 },
    ])
    expect(computeDragOps(outline, sectionDragId("s1"), sectionDragId("s1"))).toEqual([])
  })
})

describe("move buttons", () => {
  it("moves a step one place and across the edge of a section", () => {
    expect(moveStepOps(outline, "b", "down")).toEqual([
      { op: "move_step", step_id: "b", to_section_id: "s1", position: 2 },
    ])
    expect(moveStepOps(outline, "c", "down")).toEqual([
      { op: "move_step", step_id: "c", to_section_id: "s2", position: 0 },
    ])
    expect(moveStepOps(outline, "d", "up")).toEqual([
      { op: "move_step", step_id: "d", to_section_id: "s1", position: 3 },
    ])
    expect(moveStepOps(outline, "a", "up")).toEqual([])
  })

  it("moves a section and stops at the ends", () => {
    expect(moveSectionOps(outline, "s2", "up")).toEqual([{ op: "move_section", section_id: "s2", position: 0 }])
    expect(moveSectionOps(outline, "s1", "up")).toEqual([])
    expect(moveSectionOps(outline, "s3", "down")).toEqual([])
  })
})

describe("applyOutlineOps", () => {
  it("applies a cross-section move without touching the input", () => {
    const next = applyOutlineOps(outline, [{ op: "move_step", step_id: "b", to_section_id: "s2", position: 0 }])
    expect(next[0]?.steps.map((step) => step.step_id)).toEqual(["a", "c"])
    expect(next[1]?.steps.map((step) => step.step_id)).toEqual(["b", "d"])
    expect(outline[0]?.steps).toHaveLength(3)
  })

  it("reorders sections", () => {
    const next = applyOutlineOps(outline, [{ op: "move_section", section_id: "s3", position: 0 }])
    expect(next.map((section) => section.id)).toEqual(["s3", "s1", "s2"])
  })
})
