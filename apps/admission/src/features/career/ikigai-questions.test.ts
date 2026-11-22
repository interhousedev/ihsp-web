import { describe, expect, test } from "bun:test"
import { IKIGAI_QUESTIONS, deriveIkigai, mergeIkigai, textChips } from "./ikigai-questions"

const label = (question: string, option: string) => `${question}:${option}`

describe("ikigai questionnaire mapping", () => {
  test("every circle has questions and every option is a plain key", () => {
    for (const circle of ["love", "good_at", "needs", "paid"]) {
      expect(IKIGAI_QUESTIONS.some((q) => q.circle === circle)).toBe(true)
    }
    for (const q of IKIGAI_QUESTIONS) expect(q.options.every((o) => /^[a-z]+$/.test(o))).toBe(true)
  })

  test("picked chips fill their circle; a stored view without circle adds nothing", () => {
    const out = deriveIkigai(
      { ik_flow: ["build"], ik_strengths: ["logic"], ik_problems: ["health"], ik_money: ["stable"], ik_aiview: "tool" },
      label,
    )
    expect(out).toEqual({
      love: ["flow:build"],
      good_at: ["strengths:logic"],
      needs: ["problems:health"],
      paid: ["money:stable"],
    })
  })

  test("typed words come first, unknown options are dropped, questions of one circle interleave under the cap", () => {
    const out = deriveIkigai(
      {
        ik_flow: ["build", "puzzle", "explain", "design"],
        ik_flow_text: "robotics, ",
        ik_topics: ["tech", "space", "health", "money"],
        ik_values: ["nope"],
      },
      label,
    )
    expect(out.love).toEqual([
      "robotics",
      "topics:tech",
      "flow:build",
      "topics:space",
      "flow:puzzle",
      "topics:health",
      "flow:explain",
      "topics:money",
    ])
  })

  test("free text splits on commas, semicolons and lines and is cut to a chip", () => {
    expect(textChips(" a , b;c\n\n d ")).toEqual(["a", "b", "c", "d"])
    expect(textChips("x".repeat(100))[0]!.length).toBe(60)
  })

  test("merge keeps the student's own chips first, without duplicates, within the cap", () => {
    const existing = { love: ["Chess"], good_at: [], needs: [], paid: [] }
    const derived = { love: ["chess", "Music", "a", "b", "c", "d", "e", "f"], good_at: ["x"], needs: [], paid: [] }
    const out = mergeIkigai(existing, derived)
    expect(out.love).toEqual(["Chess", "Music", "a", "b", "c", "d", "e", "f"])
    expect(out.good_at).toEqual(["x"])
  })
})
