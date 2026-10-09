/** ACA-15: the pure helpers of the mark planner (what-if list, the shape of a target, formatting). */
import { describe, expect, test } from "bun:test"
import { plannerMath } from "@ihsp/test-utils"
import type { PlannerTarget } from "@ihsp/api"
import { gradesHref, plannerHref } from "../features/grades/planner/utils/hrefs"
import { formatMean, predictionKind, targetView } from "../features/grades/planner/utils/planner-view"
import { MAX_WHAT_IF, formatWhatIf, type WhatIfMark } from "../features/grades/planner/utils/what-if"
import { addWhatIf, canAddWhatIf, removeWhatIf } from "../features/grades/planner/utils/what-if-list"

const target = (spec: Partial<PlannerTarget>): PlannerTarget => ({
  grade: 5,
  threshold: 4.5,
  status: "needed",
  control: null,
  min_value: null,
  min_both: null,
  pairs: [],
  ...spec,
})

describe("formatMean", () => {
  test("a semester mark keeps its two decimals, no mark is a dash", () => {
    expect(formatMean(4.33)).toBe("4.33")
    expect(formatMean(4.5)).toBe("4.50")
    expect(formatMean(5)).toBe("5.00")
    expect(formatMean(null)).toBe("–")
  })
})

describe("targetView", () => {
  const remaining = { midterm: 2, final: 1 }

  test("secured, not reachable and unknown carry no numbers", () => {
    expect(targetView(target({ status: "secured" }), remaining)).toEqual({ kind: "secured" })
    expect(targetView(target({ status: "not_reachable" }), remaining)).toEqual({ kind: "not_reachable" })
    expect(targetView(target({ status: "unknown" }), remaining)).toEqual({ kind: "unknown" })
  })

  test("one kind of control remaining names it, the lowest mark and how many controls are left", () => {
    expect(targetView(target({ control: "midterm", min_value: 4 }), remaining)).toEqual({
      kind: "single",
      control: "midterm",
      value: 4,
      count: 2,
    })
    expect(targetView(target({ control: "final", min_value: 5 }), remaining)).toEqual({
      kind: "single",
      control: "final",
      value: 5,
      count: 1,
    })
  })

  test("both kinds remaining give the lowest mark for all and the final per midterm mark", () => {
    const pairs = [
      { midterm: 5, min_final: 4 },
      { midterm: 3, min_final: null },
    ]
    expect(targetView(target({ min_both: 5, pairs }), remaining)).toEqual({ kind: "both", minBoth: 5, pairs })
    expect(targetView(target({ pairs }), remaining)).toEqual({ kind: "both", minBoth: null, pairs })
  })

  test("the math fixture: a 5 needs both controls, a 4 and a 3 are secured", () => {
    const [five, four, three] = plannerMath.targets.map((item) => targetView(item, plannerMath.remaining))
    expect(five?.kind).toBe("both")
    expect(four).toEqual({ kind: "secured" })
    expect(three).toEqual({ kind: "secured" })
  })
})

describe("predictionKind", () => {
  test("names which remaining controls the prediction assumed a mark for", () => {
    expect(predictionKind({ value: 4.56, midterm: 5, final: 5 })).toBe("both")
    expect(predictionKind({ value: 4.5, midterm: 4, final: null })).toBe("midterm")
    expect(predictionKind({ value: 4.5, midterm: null, final: 4 })).toBe("final")
    expect(predictionKind({ value: 4.5, midterm: null, final: null })).toBe("none")
    expect(predictionKind({ value: null, midterm: null, final: null })).toBe("unknown")
  })
})

describe("what-if marks", () => {
  const marks: WhatIfMark[] = [
    { type: "midterm", value: 4 },
    { type: "final", value: 5 },
  ]

  test("a mark is added at the end and the list is not changed in place", () => {
    const next = addWhatIf(marks, { type: "lesson", value: 3 })
    expect(next.map((mark) => `${mark.type}:${mark.value}`)).toEqual(["midterm:4", "final:5", "lesson:3"])
    expect(marks).toHaveLength(2)
  })

  test("the same mark can be added twice", () => {
    expect(addWhatIf(marks, marks[0] as WhatIfMark)).toHaveLength(3)
  })

  test("a mark is removed by its position", () => {
    expect(removeWhatIf(marks, 0)).toEqual([{ type: "final", value: 5 }])
    expect(removeWhatIf(marks, 7)).toEqual(marks)
  })

  test("at most 20 marks fit; the 21st is refused", () => {
    const full = Array.from({ length: MAX_WHAT_IF }, () => ({ type: "lesson", value: 5 }) as WhatIfMark)
    expect(canAddWhatIf(marks)).toBe(true)
    expect(canAddWhatIf(full)).toBe(false)
    expect(addWhatIf(full, { type: "final", value: 2 })).toHaveLength(MAX_WHAT_IF)
  })

  test("the request lists them as type:value in the order they were added", () => {
    expect(formatWhatIf(marks)).toEqual(["midterm:4", "final:5"])
  })
})

describe("plannerHref", () => {
  test("the subject, and the semester when it is not the current one", () => {
    expect(plannerHref("abc")).toBe("/grades/plan/?subject=abc")
    expect(plannerHref("abc", 3)).toBe("/grades/plan/?subject=abc&semester=3")
  })

  test("back to the grades of the same semester", () => {
    expect(gradesHref()).toBe("/grades/")
    expect(gradesHref(3)).toBe("/grades/?semester=3")
  })
})
