// Course workspaces: a notebook that belongs to an LMS course and is shared by its staff, with the course Studio
// outputs (course plan, lesson draft) and the "Apply" actions that write them into the course draft.
// Shapes follow backend/app/shared/contracts/lms_blocks.py (the JSON of the outputs) and the notebooks HTTP schemas.

import type { Block } from "./lms-authoring"
import type { ArtifactItem } from "./notebooks"

/** POST /v1/notebooks/course-workspaces — the workspace of a course (get-or-create; creating needs `edit`). */
export type CourseWorkspace = {
  notebook_id: string
  course_id: string
  title: string
  can_write: boolean
  created: boolean
}
export type CourseWorkspaceBody = { course_id: string }

/** GET /v1/notebooks/{id}/course-steps — the DRAFT outline, for the "add course steps" picker and the Apply targets. */
/** `added`: the draft of this step is already a source of the workspace. */
export type CourseOutlineStep = { id: string; title: string; added: boolean }
export type CourseOutlineSection = { id: string; title: string; steps: CourseOutlineStep[] }
export type CourseOutline = { course_id: string; title: string; sections: CourseOutlineSection[] }

// - - - Studio outputs - - -

/** Options of `course_plan`. */
export type CoursePlanOptions = {
  language?: "uz" | "ru" | "en"
  source_ids?: string[]
  focus?: string
  depth?: "overview" | "detailed"
  sections_hint?: number
}
/** Options of `lesson_draft`; `step_id: null` means "a new step". */
export type LessonDraftOptions = {
  language?: "uz" | "ru" | "en"
  source_ids?: string[]
  step_id?: string | null
  topic?: string
  include_test?: boolean
  include_flashcards?: boolean
  length?: "short" | "standard" | "long"
}

export type PlanStep = { title: string; goals: string[]; summary: string }
export type PlanSection = { title: string; goals: string[]; steps: PlanStep[] }
/** `CoursePlanInput`: what the model writes and what Apply sends back (possibly edited by the author). */
export type CoursePlan = { summary: string; goals: string[]; sections: PlanSection[] }
export type CoursePlanContent = CoursePlan & { title: string }

export type DraftOption = { text: string; correct: boolean; pinned?: boolean }
export type DraftQuestion = {
  type: "single" | "multiple" | "text" | "number"
  prompt: string
  points?: number
  explanation?: string | null
  options?: DraftOption[] | null
  accepted_answers?: string[] | null
  regex?: string | null
  case_sensitive?: boolean
  number?: number | null
  tolerance?: number
}
export type DraftTestSettings = {
  max_attempts?: number | null
  passing_score_pct?: number
  shuffle_questions?: boolean
  shuffle_options?: boolean
  pool_size?: number | null
  time_limit_sec?: number | null
  cooldown_sec?: number | null
  show_answers?: "never" | "after_submit" | "after_pass" | "after_last_attempt"
}
/** `BlockInput`: one block as a model writes it (ids are assigned by the server). */
export type DraftBlock =
  | { type: "text"; markdown: string }
  | { type: "test"; settings?: DraftTestSettings | null; questions: DraftQuestion[] }
  | { type: "flashcards"; cards: { front: string; back: string }[] }
/** `StepDraftInput`: the `lesson_draft` output. */
export type LessonDraft = { title: string; blocks: DraftBlock[] }
export type LessonDraftContent = LessonDraft & { step_id?: string | null }

export const COURSE_KINDS = ["course_plan", "lesson_draft"] as const
export type CourseKind = (typeof COURSE_KINDS)[number]

// - - - Apply - - -

/** What an output is applied to. Without `target_step_id`, a lesson draft makes a NEW step in `target_section_id`. */
export type ApplyBody = {
  target_step_id?: string | null
  target_section_id?: string | null
  /** Append (quiz, flash cards) or replace (lesson draft). The server picks the default for the kind. */
  mode?: "append" | "replace"
  /** The plan as edited in the viewer. */
  plan?: CoursePlan
  /** The lesson as edited in the viewer. */
  draft?: LessonDraft
  /** Briefs (goals + summary) become the first text block of every NEW step of a plan. */
  add_briefs?: boolean
  /** The step's `lock_version` the preview was made against; a stale value answers 409 draft-conflict. */
  lock_version?: number | null
}

export type PlanPreviewStep = { title: string; step_id: string | null; action: "new" | "exists" }
export type PlanPreviewSection = {
  title: string
  section_id: string | null
  action: "new" | "exists"
  steps: PlanPreviewStep[]
}
export type ApplyPreview = {
  kind: "course_plan" | "lesson_draft" | "quiz" | "flashcards"
  can_apply: boolean
  problems: string[]
  /** Things the conversion left out or changed (a hint that is not copied, a block that is dropped). */
  notes: string[]
  plan?: { sections: PlanPreviewSection[]; new_sections: number; new_steps: number; existing_steps: number } | null
  step?: {
    step_id: string | null
    title: string
    lock_version: number | null
    mode: "append" | "replace"
    current_blocks: Block[] | null
    new_blocks: Block[]
  } | null
}
export type ApplyResult = {
  kind: ApplyPreview["kind"]
  created_sections: { id: string; title: string }[]
  created_steps: { step_id: string; section_id: string; title: string }[]
  step_id: string | null
  lock_version: number | null
  /** The draft sequence after the write; null when the server could not read it back. */
  draft_seq: number | null
}

/** The artifact kinds that can be applied to the course draft. */
export type ApplicableArtifact = Pick<ArtifactItem, "id" | "kind" | "title" | "status">
