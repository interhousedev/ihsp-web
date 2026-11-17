import { describe, expect, it } from "bun:test"
import { question } from "../../../tests/admission-handlers"
import { setupSteps } from "./setup-steps"

const ids = (list: { id: string }[]) => list.map((q) => q.id)

describe("setupSteps", () => {
  const questions = [
    question({ id: "q01", required: true, prefill_source: "emis" }),
    question({ id: "q07", required: true }),
    question({ id: "q09", required: true, kind: "locked" }),
    question({ id: "q11", required: false }),
    question({ id: "q38", required: false, visible_if: "account_kind=alumni" }),
  ]

  it("drops locked, optional and already known questions", () => {
    expect(ids(setupSteps(questions, { q01: "Ann" }))).toEqual(["q07", "q38"])
  })

  it("keeps a prefilled question that is still empty", () => {
    expect(ids(setupSteps(questions, {}))).toEqual(["q01", "q07", "q38"])
  })

  it("brings back a question reopened from the review", () => {
    expect(ids(setupSteps(questions, { q01: "Ann" }, ["q11"]))).toEqual(["q07", "q11", "q38"])
  })
})
