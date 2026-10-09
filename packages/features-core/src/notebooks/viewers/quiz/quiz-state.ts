// Progress and scoring of a quiz (docs/reference/notebooklm.md § 3.4.4): `{answers: {q1: ["a"]}, current: 3,
// submitted: true}`. `queue` is an optional extra: the question ids of a "Retry wrong answers" round.
// All functions are pure.

import type { QuizQuestion } from "@ihsp/api"

export type QuizState = {
  /** The checked answers: question id to the chosen option ids. A skipped question has no entry. */
  answers: Record<string, string[]>
  /** Index of the question on screen (among the questions of the round). */
  current: number
  /** The student finished the round: the results are shown. */
  submitted: boolean
  /** Only these questions are in the round (a retry of the wrong ones); all questions when absent. */
  queue?: string[]
}

export type QuestionVerdict = "correct" | "wrong" | "skipped"

export type QuizSummary = {
  total: number
  correct: number
  wrong: number
  skipped: number
  /** Correct answers out of all questions, in percent. */
  score: number
  /** Correct answers out of the questions that were answered, in percent. */
  accuracy: number
}

export const freshQuiz = (): QuizState => ({ answers: {}, current: 0, submitted: false })

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")

/** The questions of the round, in order. */
export function roundQuestions(state: QuizState, questions: readonly QuizQuestion[]): QuizQuestion[] {
  if (!state.queue) return [...questions]
  const queue = new Set(state.queue)
  return questions.filter((question) => queue.has(question.id))
}

function clampCurrent(state: QuizState, questions: readonly QuizQuestion[]): QuizState {
  const last = Math.max(0, roundQuestions(state, questions).length - 1)
  const current = Math.min(Math.max(0, state.current), last)
  return current === state.current ? state : { ...state, current }
}

/** Reads the saved progress; anything with an unexpected shape gives a fresh quiz, unknown ids are dropped. */
export function parseQuiz(raw: unknown, questions: readonly QuizQuestion[]): QuizState {
  if (typeof raw !== "object" || raw === null) return freshQuiz()
  const { answers, current, submitted, queue } = raw as Record<string, unknown>
  if (
    typeof answers !== "object" ||
    answers === null ||
    Array.isArray(answers) ||
    typeof current !== "number" ||
    !Number.isFinite(current) ||
    typeof submitted !== "boolean"
  ) {
    return freshQuiz()
  }
  const byId = new Map(questions.map((question) => [question.id, question]))
  const cleaned: Record<string, string[]> = {}
  for (const [id, chosen] of Object.entries(answers)) {
    const question = byId.get(id)
    if (!question || !isStringArray(chosen)) continue
    const valid = new Set(question.options.map((option) => option.id))
    const picks = [...new Set(chosen)].filter((optionId) => valid.has(optionId))
    const kept = question.type === "multiple" ? picks : picks.slice(0, 1)
    if (kept.length > 0) cleaned[id] = kept
  }
  const queueIds = isStringArray(queue) ? queue.filter((id) => byId.has(id)) : []
  const state: QuizState = {
    answers: cleaned,
    current: Math.trunc(current),
    submitted,
    ...(queueIds.length > 0 ? { queue: queueIds } : {}),
  }
  return clampCurrent(state, questions)
}

/** The student chose exactly the right options. */
export function isCorrect(question: QuizQuestion, chosen: readonly string[]): boolean {
  return chosen.length === question.correct.length && question.correct.every((id) => chosen.includes(id))
}

export function verdictOf(question: QuizQuestion, answers: QuizState["answers"]): QuestionVerdict {
  const chosen = answers[question.id]
  if (!chosen || chosen.length === 0) return "skipped"
  return isCorrect(question, chosen) ? "correct" : "wrong"
}

export function summarize(questions: readonly QuizQuestion[], answers: QuizState["answers"]): QuizSummary {
  const verdicts = questions.map((question) => verdictOf(question, answers))
  const correct = verdicts.filter((verdict) => verdict === "correct").length
  const wrong = verdicts.filter((verdict) => verdict === "wrong").length
  const total = questions.length
  const answered = correct + wrong
  return {
    total,
    correct,
    wrong,
    skipped: total - answered,
    score: total === 0 ? 0 : Math.round((correct / total) * 100),
    accuracy: answered === 0 ? 0 : Math.round((correct / answered) * 100),
  }
}

/** Checks an answer. A checked answer is final: it cannot be changed. */
export function answerQuestion(state: QuizState, questionId: string, chosen: readonly string[]): QuizState {
  if (chosen.length === 0 || state.answers[questionId]) return state
  return { ...state, answers: { ...state.answers, [questionId]: [...chosen] } }
}

/** Goes to another question of the round (clamped). */
export function goTo(state: QuizState, index: number, questions: readonly QuizQuestion[]): QuizState {
  return clampCurrent({ ...state, current: index }, questions)
}

export function finish(state: QuizState): QuizState {
  return state.submitted ? state : { ...state, submitted: true }
}

/** Everything again: no answers, all questions. */
export const retryAll = (): QuizState => freshQuiz()

/** A new round with only the questions that were answered wrongly; their old answers are cleared. */
export function retryWrong(state: QuizState, questions: readonly QuizQuestion[]): QuizState {
  const wrongIds = roundQuestions(state, questions)
    .filter((question) => verdictOf(question, state.answers) === "wrong")
    .map((question) => question.id)
  if (wrongIds.length === 0) return state
  const answers = Object.fromEntries(Object.entries(state.answers).filter(([id]) => !wrongIds.includes(id)))
  return { answers, current: 0, submitted: false, queue: wrongIds }
}
