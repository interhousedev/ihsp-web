import type { StepAnswers, StepQuestion } from "./types"

/** A question counts as answered once it holds a value (a multi-choice needs at least one pick). */
export function isAnswered(question: StepQuestion, answers: StepAnswers): boolean {
  const value = answers[question.id]
  if (value === undefined || value === null || value === "") return false
  return Array.isArray(value) ? value.length > 0 : true
}

/** Index of the first required question without an answer, or `questions.length` when none is missing. */
export function firstUnanswered(questions: StepQuestion[], answers: StepAnswers): number {
  const index = questions.findIndex((question) => !question.optional && !isAnswered(question, answers))
  return index === -1 ? questions.length : index
}

/** Next is open once the current question is answered (or is optional). */
export function canAdvance(question: StepQuestion | undefined, answers: StepAnswers): boolean {
  return question !== undefined && (question.optional === true || isAnswered(question, answers))
}

/** Share of answered questions, 0..1. */
export function progressOf(questions: StepQuestion[], answers: StepAnswers): number {
  if (questions.length === 0) return 0
  return questions.filter((question) => isAnswered(question, answers)).length / questions.length
}
