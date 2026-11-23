import { describe, expect, test } from "bun:test"
import type { BadgeRule } from "@ihsp/api"
import {
  MAX_BLOCKS,
  insertBlock,
  locate,
  moveBlock,
  moveTargets,
  newBlock,
  removeBlock,
  ruleToWorkspace,
  updateBlock,
  validateWorkspace,
  workspaceToRule,
  type Block,
  type Workspace,
} from "./rule-blocks"

const STEP = "0190a000-0000-7000-8000-000000000001"

describe("rule <-> blocks", () => {
  test("a rule without a condition is an empty stack", () => {
    const rule: BadgeRule = { event: "course_completed", condition: null }
    const ws = ruleToWorkspace(rule)
    expect(ws.stack).toEqual([])
    expect(workspaceToRule(ws)).toEqual(rule)
  })

  test("a top-level AND becomes the stack and back", () => {
    const rule: BadgeRule = {
      event: "test_passed",
      condition: {
        op: "and",
        children: [
          { op: "score_gte", value: 90 },
          {
            op: "or",
            children: [
              { op: "section_is", section_id: "s1" },
              { op: "step_is", step_id: STEP },
            ],
          },
          { op: "not", child: { op: "within_days_of_enroll", value: 30 } },
        ],
      },
    }
    const ws = ruleToWorkspace(rule)
    expect(ws.stack.map((b) => b.op)).toEqual(["score_gte", "or", "not"])
    expect(workspaceToRule(ws)).toEqual(rule)
    expect(validateWorkspace(ws)).toEqual([])
  })

  test("a single block is the condition itself", () => {
    const rule: BadgeRule = { event: "streak_reached", condition: { op: "count_gte", value: 7 } }
    expect(workspaceToRule(ruleToWorkspace(rule))).toEqual(rule)
  })
})

describe("validation", () => {
  const ws = (stack: Block[]): Workspace => ({ event: "step_completed", stack })
  const group = (op: "and" | "or" | "not", children: Block[]): Block => ({ ...newBlock(op), children })

  test("AND/OR need 2 to 8 children, NOT exactly one", () => {
    const and = group("and", [newBlock("score_gte")])
    const not = group("not", [])
    const codes = validateWorkspace(ws([and, not])).map((p) => p.code)
    expect(codes).toEqual(["childCount", "notEmpty"])
    const nine = group(
      "or",
      Array.from({ length: 9 }, () => newBlock("score_gte")),
    )
    expect(validateWorkspace(ws([nine])).map((p) => p.code)).toEqual(["childCount"])
  })

  test("numbers out of range and missing section or step", () => {
    const score = { ...newBlock("score_gte"), value: 101 }
    const days = { ...newBlock("within_days_of_enroll"), value: 0 }
    const count = { ...newBlock("count_gte"), value: 2.5 }
    const codes = validateWorkspace(ws([score, days, count, newBlock("section_is"), newBlock("step_is")])).map(
      (p) => p.code,
    )
    expect(codes).toEqual(["numberRange", "numberRange", "numberRange", "sectionMissing", "stepMissing"])
  })

  test("depth 6 passes, 7 fails (the stack AND counts when it has two blocks)", () => {
    let inner: Block = newBlock("score_gte")
    for (let i = 0; i < 5; i += 1) inner = group("not", [inner])
    expect(validateWorkspace(ws([inner]))).toEqual([])
    const problems = validateWorkspace(ws([inner, newBlock("count_gte")]))
    expect(problems.map((p) => p.code)).toEqual(["tooDeep"])
  })

  test("more than 32 blocks and more than 8 in the stack", () => {
    const groups = Array.from({ length: 4 }, () =>
      group(
        "and",
        Array.from({ length: 8 }, () => newBlock("score_gte")),
      ),
    )
    const codes = validateWorkspace(ws(groups)).map((p) => p.code)
    expect(codes).toEqual(["tooManyBlocks"])
    expect(MAX_BLOCKS).toBe(32)
    const long = validateWorkspace(ws(Array.from({ length: 9 }, () => newBlock("score_gte")))).map((p) => p.code)
    expect(long).toEqual(["stackTooLong"])
  })
})

describe("editing", () => {
  test("insert, update, move and remove", () => {
    const or = newBlock("or")
    const a = newBlock("score_gte")
    const b = newBlock("count_gte")
    let ws: Workspace = { event: "test_passed", stack: [] }
    ws = insertBlock(ws, null, 0, or)
    ws = insertBlock(ws, or.id, 0, a)
    ws = insertBlock(ws, null, 1, b)
    ws = updateBlock(ws, a.id, { value: 50 })
    ws = moveBlock(ws, b.id, or.id, 1)
    expect(locate(ws.stack, b.id)).toEqual({ parent: or.id, index: 1 })
    expect(workspaceToRule(ws).condition).toEqual({
      op: "or",
      children: [
        { op: "score_gte", value: 50 },
        { op: "count_gte", value: 3 },
      ],
    })
    ws = moveBlock(ws, b.id, or.id, 0)
    expect(locate(ws.stack, b.id)).toEqual({ parent: or.id, index: 0 })
    ws = removeBlock(ws, or.id)
    expect(ws.stack).toEqual([])
  })

  test("a block cannot go into itself and NOT takes one child", () => {
    const not = newBlock("not")
    const a = newBlock("score_gte")
    const b = newBlock("score_gte")
    let ws: Workspace = { event: "test_passed", stack: [not, b] }
    ws = insertBlock(ws, not.id, 0, a)
    expect(moveBlock(ws, not.id, not.id, 0)).toBe(ws)
    expect(moveBlock(ws, b.id, not.id, 0)).toBe(ws)
    expect(moveTargets(ws, b.id).map((t) => t.parent)).toEqual([null])
    expect(moveTargets(ws, a.id).map((t) => t.parent)).toEqual([null, not.id])
  })
})
