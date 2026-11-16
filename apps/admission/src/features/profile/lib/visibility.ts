import type { AdmissionConfig, AnswerValue, Answers, Question } from "../types"

/** What a `visible_if` rule (`key=value`) can look at: the answers and the account kind. */
export type VisibilityContext = { answers: Answers; accountKind: string }

/** Evaluates `key=value`; a rule without `=` or an unknown key hides nothing. */
export function isQuestionVisible(question: Question, context: VisibilityContext): boolean {
  const rule = question.visible_if
  if (!rule) return true
  const at = rule.indexOf("=")
  if (at < 0) return true
  const key = rule.slice(0, at).trim()
  const expected = rule.slice(at + 1).trim()
  const actual = key === "account_kind" ? context.accountKind : context.answers[key]
  return String(actual ?? "") === expected
}

/** The questions the student sees, in the backend's order. */
export function visibleQuestions(config: AdmissionConfig, context: VisibilityContext): Question[] {
  return config.questions.filter((question) => isQuestionVisible(question, context))
}

export function isAnswered(value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === "string") return value.trim() !== ""
  if (Array.isArray(value)) return value.length > 0
  return true
}

/** Required visible questions without an answer. A locked question is prefilled by the school, so it never blocks. */
export function missingRequired(questions: Question[], answers: Answers): string[] {
  return questions
    .filter((question) => question.required && question.kind !== "locked" && !isAnswered(answers[question.id]))
    .map((question) => question.id)
}

/** Section ids in the order they first appear. */
export function sectionsOf(questions: Question[]): string[] {
  return [...new Set(questions.map((question) => question.section))]
}
