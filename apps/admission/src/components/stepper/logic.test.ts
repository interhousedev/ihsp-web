import { describe, expect, test } from "bun:test"
import { canAdvance, firstUnanswered } from "./logic"
import type { StepQuestion } from "./types"

const q = (id: string, optional?: boolean): StepQuestion => ({
  id,
  section: "s",
  sectionLabel: "S",
  title: id,
  kind: "select",
  options: [],
  optional,
})

describe("optional questions", () => {
  test("Next is open without an answer", () => {
    expect(canAdvance(q("a", true), {})).toBe(true)
    expect(canAdvance(q("a"), {})).toBe(false)
  })

  test("resume skips an unanswered optional question", () => {
    const questions = [q("a"), q("b", true), q("c")]
    expect(firstUnanswered(questions, { a: "x" })).toBe(2)
    expect(firstUnanswered(questions, { a: "x", c: "y" })).toBe(3)
  })
})
