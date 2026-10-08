// LMS — catalog, learning, attempts, review (backend § API contract → "LMS (B12 authoring, B13 learning)" rows of B13, and Schemas).

import type { PersonRef, ReviewRating } from "./common"
import type { StudyNext } from "./flashcards"

export type CourseCard = {
  id: string
  slug: string
  title: string
  description: string
  cover_url: string | null
  steps_count: number
  progress_pct: number | null
  visibility: "public" | "invite"
  updated_at: string | null
}

export type CourseStaffItem = {
  user: PersonRef
  role: string
  permissions: ("edit" | "publish" | "review" | "manage_staff" | "view_drafts")[]
  show_on_page: boolean
  position: number
}

export type OutlineSection = {
  id: string
  title: string
  steps: {
    step_id: string
    title: string
    completed?: boolean
    badge?: "new" | "changed" | "removed" | "mcp" | null
  }[]
}

/** The outline a learner sees: steps are new or changed since the last visit (editors also see removed and MCP steps). */
export type LearnerOutlineSection = Omit<OutlineSection, "steps"> & {
  steps: (Omit<OutlineSection["steps"][number], "badge"> & { badge?: "new" | "changed" | null })[]
}

export type CoursePage = CourseCard & {
  staff: CourseStaffItem[]
  outline: LearnerOutlineSection[]
  enrolled: boolean
  can_edit: boolean
  changed_since_last_visit: string[]
}

export type StepView = {
  step_id: string
  revision_id: string
  title: string
  blocks: (
    | { id: string; type: "text"; markdown: string }
    | {
        id: string
        type: "test"
        rules: {
          questions: number
          attempts_left: number | null
          time_limit_sec: number | null
          passing_score_pct: number
        }
        best: AttemptResult | null
        open_attempt_id: string | null
      }
    | { id: string; type: "flashcards"; cards_count: number; due: number }
  )[]
  completed: boolean
  preview: boolean
}

export type Answer = { option_ids?: string[]; text?: string; number?: number }

export type AttemptView = {
  id: string
  block_id: string
  attempt_no: number
  started_at: string
  deadline_at: string | null
  questions: {
    id: string
    type: string
    prompt: string
    points: number
    /** Null for text and number questions. */
    options?: { id: string; text: string }[] | null
  }[]
  answers: Record<string, Answer>
  submitted_at: string | null
}

export type AttemptResult = {
  id: string
  score: number
  max_score: number
  passed: boolean
  submitted_at: string
  review:
    | {
        question_id: string
        correct: boolean
        /** Same shape as the student's answer: `{option_ids}`, `{text}` or `{number}`. */
        correct_answer?: Answer | null
        explanation?: string | null
      }[]
    | null
}

export type LmsCardStudy = {
  block_id: string
  card: { id: string; front: string; back: string } | null
  intervals: StudyNext["intervals"]
  counts: StudyNext["counts"]
}

export type CourseStudent = {
  user: PersonRef
  progress_pct: number
  completed_at: string | null
  attempts: {
    id: string
    step_id: string
    block_id: string
    score: number
    max_score: number
    passed: boolean
    submitted_at: string
  }[]
}

export type AttemptReview = AttemptResult & {
  user: PersonRef
  variant: Record<string, unknown> | null
  answers: Record<string, Answer>
  revision_id: string
  override_score: number | null
  override_comment: string | null
}

// --- Not fully specified in the contract (see the W0A report) ---

/**
 * `GET /v1/lms/my-courses`: the contract says "`CourseCard[]` (enrolled) + `managed: CourseCard[]`".
 * Assumed JSON: `{enrolled, managed}`.
 */
export type MyCourses = { enrolled: CourseCard[]; managed: CourseCard[] }

/** `POST /v1/lms/steps/{step_id}/viewed` returns `StepProgressItem`, which the contract does not define. */
export type StepProgressItem = { step_id: string; viewed_at: string | null; completed: boolean }

// --- Request bodies and query parameters ---

export type CourseCatalogParams = { query?: string }
export type CourseJoinBody = { code: string }
export type AttemptAnswersBody = { answers: Record<string, Answer> }
export type AttemptOverrideBody = { score: number; comment: string }
export type LmsCardReviewBody = { rating: ReviewRating }
/** `preview=true` starts a preview attempt for staff with `view_drafts`. */
export type AttemptStartParams = { preview?: boolean }
