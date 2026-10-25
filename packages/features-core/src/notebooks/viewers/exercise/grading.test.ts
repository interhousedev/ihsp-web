import { describe, expect, it } from "bun:test"
import { exerciseContent } from "@ihsp/test-utils"
import type { ExerciseQuestion } from "@ihsp/api"
import { gradeExercise, gradeQuestion, normalizeAnswer, readProgress, withinLimit, wordCount } from "./grading"

const questions = exerciseContent.sections[0]?.questions ?? []
function question(id: string): ExerciseQuestion {
  const found = questions.find((q) => q.id === id)
  if (!found) throw new Error(id)
  return found
}

describe("exercise grading", () => {
  it("normalises typed answers like the backend", () => {
    expect(normalizeAnswer("  The   Starch. ")).toBe("the starch")
    expect(wordCount("O2 leaves")).toBe(2)
    expect(withinLimit("one two three", 2)).toBe(false)
    expect(withinLimit("anything at all", 0)).toBe(true)
  })

  it("grades each objective type", () => {
    expect(gradeQuestion(question("q1"), "B")).toEqual({ earned: 1, possible: 1 })
    expect(gradeQuestion(question("q1"), "A")).toEqual({ earned: 0, possible: 1 })
    expect(gradeQuestion(question("q2"), ["B", "A"])).toEqual({ earned: 1, possible: 1 })
    expect(gradeQuestion(question("q2"), ["A"])).toEqual({ earned: 0, possible: 1 })
    expect(gradeQuestion(question("q3"), "not_given")).toEqual({ earned: 1, possible: 1 })
    expect(gradeQuestion(question("q4"), { "4.1": "B", "4.2": "B" })).toEqual({ earned: 1, possible: 2 })
    expect(gradeQuestion(question("q5"), " STARCH ")).toEqual({ earned: 1, possible: 1 })
    expect(gradeQuestion(question("q6"), "o2")).toEqual({ earned: 1, possible: 1 })
  })

  it("a typed answer over the word limit is wrong even when it contains the answer", () => {
    expect(gradeQuestion(question("q5"), "the starch")).toEqual({ earned: 0, possible: 1 })
  })

  it("an essay has no points and the total matches total_points", () => {
    expect(gradeQuestion(question("q7"), "text")).toEqual({ earned: 0, possible: 0 })
    expect(gradeExercise(exerciseContent, {}).possible).toBe(exerciseContent.total_points)
  })

  it("reads saved progress defensively", () => {
    expect(readProgress(null)).toEqual({ answers: {}, submitted: false })
    expect(readProgress({ answers: { q1: "B" }, submitted: true })).toEqual({ answers: { q1: "B" }, submitted: true })
  })
})
