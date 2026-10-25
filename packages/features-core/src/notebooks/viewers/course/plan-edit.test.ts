import { describe, expect, it } from "bun:test"
import type { CoursePlan } from "@ihsp/api"
import { coursePlanContent } from "@ihsp/test-utils"
import {
  addSection,
  addStep,
  cleanPlan,
  goalsFromText,
  moveSection,
  moveStep,
  planProblem,
  removeSection,
  removeStep,
  renameSection,
  updateStep,
} from "./plan-edit"

const plan: CoursePlan = {
  summary: coursePlanContent.summary,
  goals: coursePlanContent.goals,
  sections: coursePlanContent.sections,
}

describe("plan edits", () => {
  it("renames a section and a step without touching the original", () => {
    const renamed = updateStep(renameSection(plan, 0, "Mechanics"), 0, 1, { title: "Laws of Newton" })
    expect(renamed.sections[0]?.title).toBe("Mechanics")
    expect(renamed.sections[0]?.steps[1]?.title).toBe("Laws of Newton")
    expect(plan.sections[0]?.title).toBe("Motion")
  })

  it("moves sections and steps and ignores moves past the ends", () => {
    expect(moveSection(plan, 1, -1).sections.map((s) => s.title)).toEqual(["Energy", "Motion"])
    expect(moveSection(plan, 0, -1).sections.map((s) => s.title)).toEqual(["Motion", "Energy"])
    expect(moveStep(plan, 0, 0, 1).sections[0]?.steps.map((s) => s.title)).toEqual(["Newton's laws", "Kinematics"])
    expect(moveStep(plan, 0, 1, 1).sections[0]?.steps.map((s) => s.title)).toEqual(["Kinematics", "Newton's laws"])
  })

  it("removes and adds sections and steps", () => {
    expect(removeSection(plan, 0).sections).toHaveLength(1)
    expect(removeStep(plan, 0, 0).sections[0]?.steps).toHaveLength(1)
    expect(addSection(plan, "Waves").sections.at(-1)?.title).toBe("Waves")
    expect(addStep(plan, 1).sections[1]?.steps).toHaveLength(3)
  })

  it("does not grow past the limits of the server", () => {
    let big = plan
    for (let i = 0; i < 40; i++) big = addSection(big, `S${i}`)
    expect(big.sections).toHaveLength(30)
    let steps = plan
    for (let i = 0; i < 40; i++) steps = addStep(steps, 0)
    expect(steps.sections[0]?.steps).toHaveLength(30)
  })

  it("reads goals one per line and drops blanks", () => {
    expect(goalsFromText("  Read graphs \n\n Solve problems\n")).toEqual(["Read graphs", "Solve problems"])
  })

  it("explains why a plan cannot be applied", () => {
    expect(planProblem(plan)).toBeNull()
    expect(planProblem({ ...plan, sections: [] })).toBe("no-sections")
    expect(planProblem(addSection(plan, "Waves"))).toBe("empty-title")
    expect(planProblem(renameSection(plan, 0, "  "))).toBe("empty-title")
    expect(planProblem(removeStep(removeStep(plan, 1, 0), 1, 0))).toBe("no-steps")
  })

  it("trims what is sent", () => {
    const cleaned = cleanPlan(renameSection(updateStep(plan, 0, 0, { goals: [" a ", ""] }), 0, "  Motion  "))
    expect(cleaned.sections[0]?.title).toBe("Motion")
    expect(cleaned.sections[0]?.steps[0]?.goals).toEqual(["a"])
  })
})
