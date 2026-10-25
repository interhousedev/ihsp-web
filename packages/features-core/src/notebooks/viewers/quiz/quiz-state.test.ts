import { describe, expect, it } from "bun:test"
import { quizContent } from "@ihsp/test-utils"
import {
  answerQuestion,
  finish,
  freshQuiz,
  goTo,
  isCorrect,
  parseQuiz,
  retryAll,
  retryWrong,
  roundQuestions,
  summarize,
  verdictOf,
} from "./quiz-state"

const questions = quizContent.questions
const [q1, q2, q3, q4] = questions
if (!q1 || !q2 || !q3 || !q4) throw new Error("fixture needs four questions")

describe("isCorrect and verdictOf", () => {
  it("accepts exactly the right options", () => {
    expect(isCorrect(q1, ["a"])).toBe(true)
    expect(isCorrect(q1, ["b"])).toBe(false)
    expect(isCorrect(q2, ["c", "a", "b"])).toBe(true)
    expect(isCorrect(q2, ["a", "b"])).toBe(false)
    expect(isCorrect(q2, ["a", "b", "c", "d"])).toBe(false)
  })

  it("tells correct, wrong and skipped apart", () => {
    const answers = { q1: ["a"], q2: ["a"] }
    expect(verdictOf(q1, answers)).toBe("correct")
    expect(verdictOf(q2, answers)).toBe("wrong")
    expect(verdictOf(q3, answers)).toBe("skipped")
  })
})

describe("summarize", () => {
  it("counts correct, wrong and skipped, with the score and the accuracy", () => {
    const summary = summarize(questions, { q1: ["a"], q2: ["a"], q3: ["false"] })
    expect(summary).toEqual({ total: 4, correct: 2, wrong: 1, skipped: 1, score: 50, accuracy: 67 })
  })

  it("has a score of 0 and no division by zero when nothing was answered", () => {
    expect(summarize(questions, {})).toEqual({ total: 4, correct: 0, wrong: 0, skipped: 4, score: 0, accuracy: 0 })
    expect(summarize([], {}).score).toBe(0)
  })
})

describe("answering and navigating", () => {
  it("keeps the first answer of a question", () => {
    const first = answerQuestion(freshQuiz(), "q1", ["b"])
    expect(answerQuestion(first, "q1", ["a"])).toBe(first)
    expect(first.answers).toEqual({ q1: ["b"] })
  })

  it("ignores an empty answer", () => {
    const state = freshQuiz()
    expect(answerQuestion(state, "q1", [])).toBe(state)
  })

  it("clamps the current question and finishes once", () => {
    expect(goTo(freshQuiz(), 99, questions).current).toBe(3)
    expect(goTo(freshQuiz(), -2, questions).current).toBe(0)
    const done = finish(freshQuiz())
    expect(done.submitted).toBe(true)
    expect(finish(done)).toBe(done)
  })
})

describe("retry", () => {
  const played = { answers: { q1: ["a"], q2: ["a"], q3: ["true"] }, current: 3, submitted: true }

  it("starts all over", () => {
    expect(retryAll()).toEqual({ answers: {}, current: 0, submitted: false })
  })

  it("keeps only the wrong questions in a new round and clears their answers", () => {
    const next = retryWrong(played, questions)
    expect(next).toEqual({ answers: { q1: ["a"] }, current: 0, submitted: false, queue: ["q2", "q3"] })
    expect(roundQuestions(next, questions).map((question) => question.id)).toEqual(["q2", "q3"])
  })

  it("scores only the questions of the round", () => {
    const next = retryWrong(played, questions)
    const round = roundQuestions(answerQuestion(next, "q2", ["a", "b", "c"]), questions)
    expect(summarize(round, answerQuestion(next, "q2", ["a", "b", "c"]).answers).total).toBe(2)
  })

  it("does nothing when nothing was wrong", () => {
    const clean = { answers: { q1: ["a"] }, current: 0, submitted: true }
    expect(retryWrong(clean, questions)).toBe(clean)
  })
})

describe("parseQuiz", () => {
  it("restores a saved quiz", () => {
    const saved = { answers: { q1: ["a"], q2: ["a", "b"] }, current: 2, submitted: false }
    expect(parseQuiz(saved, questions)).toEqual(saved)
  })

  it("starts fresh from an unknown shape", () => {
    for (const raw of [null, undefined, 3, "x", [], {}, { answers: [], current: 0, submitted: false }]) {
      expect(parseQuiz(raw, questions)).toEqual(freshQuiz())
    }
    expect(parseQuiz({ answers: {}, current: "2", submitted: false }, questions)).toEqual(freshQuiz())
  })

  it("drops answers to unknown questions and unknown options, and keeps one pick for a single choice", () => {
    const parsed = parseQuiz(
      { answers: { q1: ["a", "b"], q2: ["a", "zz"], nope: ["a"], q4: ["zz"] }, current: 0, submitted: false },
      questions,
    )
    expect(parsed.answers).toEqual({ q1: ["a"], q2: ["a"] })
  })

  it("clamps the current question and restores a retry round", () => {
    const parsed = parseQuiz({ answers: {}, current: 9, submitted: false, queue: ["q2", "q3", "gone"] }, questions)
    expect(parsed.queue).toEqual(["q2", "q3"])
    expect(parsed.current).toBe(1)
  })
})
