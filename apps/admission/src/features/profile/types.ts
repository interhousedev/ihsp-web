/** Shapes of `/v1/admission/config` and `/v1/admission/me/profile` (the OpenAPI schemas `QuestionOut`, `ProfileOut`). */

export type QuestionKind =
  | "single"
  | "multi"
  | "text"
  | "number"
  | "money"
  | "range"
  | "country"
  | "combobox"
  | "scale"
  | "date"
  | "switch"
  | "repeat"
  | "locked"

export type Question = {
  id: string
  section: string
  kind: QuestionKind
  required: boolean
  options: string[]
  max_length?: number | null
  max_choices?: number | null
  visible_if?: string | null
  prefill_source?: string | null
}

export type AdmissionConfig = {
  question_set: string
  questions: Question[]
  options: Record<string, string[]>
  limits: Record<string, number>
  wellbeing_questions_enabled: boolean
}

export type AnswerValue = string | number | boolean | string[] | number[] | Record<string, unknown>[] | null

export type Answers = Record<string, AnswerValue>

export type Profile = {
  student_id: string
  account_kind: string
  stage: "setup" | "words" | "items" | "chooser" | "docs" | "submitted"
  question_set_version: string
  answers: Answers
  next_question: string | null
  missing_required: string[]
  setup_completed: boolean
  lock_version: number
}
