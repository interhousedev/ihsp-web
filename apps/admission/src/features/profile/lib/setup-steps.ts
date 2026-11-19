import type { Answers, Question } from "../types"
import { isAnswered } from "./visibility"

/** Residence, field of study and destination countries are edited in Settings, Career and Search; legacy answers stay readable. */
export const MOVED_QUESTIONS: readonly string[] = ["q05", "q18", "q24"]

/**
 * The screens of the first setup: only what the student must answer. Skipped here (all stay editable from the review):
 * locked questions (the school fills them), answers already known from the school record, and optional detail
 * questions. An optional question with a `visible_if` rule is kept, since it only appears for the group it is for.
 * `known` is the profile as it was when setup opened, so the list does not shift while the student types.
 * `reopened` are questions the student chose to edit from the review.
 */
export function setupSteps(questions: Question[], known: Answers, reopened: readonly string[] = []): Question[] {
  return questions.filter((question) => {
    if (reopened.includes(question.id)) return true
    if (question.kind === "locked") return false
    if (question.prefill_source && isAnswered(known[question.id])) return false
    return question.required || Boolean(question.visible_if)
  })
}
