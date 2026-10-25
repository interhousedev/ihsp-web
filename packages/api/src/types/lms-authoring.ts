// LMS — authoring, drafts, versions, staff (backend § API contract → "LMS (B12 authoring, B13 learning)" rows of B12, and Schemas).

import type { PersonRef } from "./common"
import type { H5PBlock, InteractiveVideoBlock } from "./lms-interactive"
import type { CourseStaffItem, OutlineSection } from "./lms-learning"

export type TestConfig = {
  max_attempts: number | null
  passing_score_pct: number
  shuffle_questions: boolean
  shuffle_options: boolean
  pool_size: number | null
  time_limit_sec: number | null
  cooldown_sec: number | null
  show_answers: "never" | "after_submit" | "after_pass" | "after_last_attempt"
}

export type QuestionType =
  | "single"
  | "multiple"
  | "text"
  | "number"
  | "sorting"
  | "matching"
  | "table"
  | "blanks"
  | "random_number"
  | "formula"
  | "free"
  | "code"

export type Question = {
  id: string
  type: QuestionType
  prompt: string
  points: number
  explanation: string | null
  options?: { id: string; text: string; correct: boolean; pinned: boolean }[]
  answer?: {
    accepted?: string[]
    regex?: string | null
    case_sensitive?: boolean
    value?: number
    tolerance?: number
  }
  /** Matching: the left item and its right match. */
  pairs?: { id: string; left: string; right: string }[]
  /** Table: `correct[row][column]` marks the cells to tick. */
  table?: { rows: string[]; columns: string[]; correct: boolean[][] }
  /** Fill blanks: blank `n` is `{{n}}` (1-based) in the prompt. */
  blanks?: { id: string; accepted: string[]; regex?: string | null; case_sensitive?: boolean }[]
  /** Random numeric: each attempt draws the variables; `{name}` in the prompt shows the value. */
  random?: {
    variables: { name: string; min: number; max: number; integer: boolean }[]
    formula: string
    tolerance: number
  }
  /** Math formula: compared by value at sample points. */
  formula?: { expression: string; variables: string[]; mode: "symbolic" | "numeric"; tolerance: number }
  /** Programming: no code is run; the reported output is compared, or a reviewer scores it. */
  code?: { language: string; starter: string; expected_outputs: string[] }
}

export type Block =
  | { id: string; type: "text"; markdown: string }
  | { id: string; type: "video"; source: "link" | "upload"; url: string; file_id: string | null; caption: string }
  | { id: string; type: "test"; config: TestConfig; questions: Question[] }
  | { id: string; type: "flashcards"; cards: { id: string; front: string; back: string }[] }
  | H5PBlock
  | InteractiveVideoBlock

export type StepContent = { title: string; blocks: Block[] }

export type CourseDraft = {
  id: string
  slug: string
  title: string
  description: string
  visibility: "public" | "invite"
  status: "active" | "archived"
  invite_code: string | null
  lock_version: number
  draft_seq: number
  outline: OutlineSection[]
  pending_count: number
  live_version: number | null
  my_permissions: string[]
}

export type OutlineOp =
  | { op: "add_section"; title: string; position?: number }
  | { op: "rename_section"; section_id: string; title: string }
  | { op: "move_section"; section_id: string; position: number }
  | { op: "remove_section"; section_id: string }
  | { op: "move_step"; step_id: string; to_section_id: string; position: number }
  | { op: "remove_step"; step_id: string }

export type StepDraft = {
  step_id: string
  course_id: string
  content: StepContent
  lock_version: number
  status: "new" | "changed" | "unchanged"
  updated_via: "ui" | "mcp" | "ai"
  updated_by: PersonRef | null
  updated_at: string | null
}

export type RevisionItem = {
  id: string
  kind: "publish" | "checkpoint" | "preview"
  label: string | null
  created_by: PersonRef
  created_at: string
  published: boolean
}

export type PendingChanges = {
  draft_seq: number
  outline_changed: boolean
  steps: {
    step_id: string
    title: string
    change: "added" | "changed" | "removed"
    via_mcp: boolean
    via_ai: boolean
  }[]
}

export type VersionItem = {
  number: number
  published_by: PersonRef
  published_at: string
  note: string | null
  changes: { added: number; changed: number; removed: number; outline_changed: boolean }
}

export type VersionView = VersionItem & {
  meta: { title: string; description: string }
  outline: OutlineSection[]
}

export type VersionCompare = {
  a: number
  b: number
  steps: {
    step_id: string
    title: string
    change: "added" | "changed" | "removed" | "same"
    revision_a: string | null
    revision_b: string | null
  }[]
}

/** A person who holds `lms_creator` (`GET /v1/staff/lms/creators`). */
export type CourseCreator = {
  id: string
  login: string | null
  first_name: string
  last_name: string
  middle_name: string | null
  status: string
}

// --- Request bodies and query parameters ---

/** `POST /v1/staff/lms/courses/{id}/broadcasts`: an update for the enrolled students (title up to 120, text up to 2000). */
export type CourseBroadcastBody = { title: string; body: string }

/** A sent course broadcast; `recipients` is known only in the answer to the POST. */
export type CourseBroadcast = {
  id: string
  course_id: string
  author_id: string
  title: string
  body: string
  created_at: string
  /** Set once the broadcast was edited (the "изменено" marker). */
  updated_at?: string | null
  recipients?: number | null
}

/** `PATCH /v1/staff/lms/courses/{id}/broadcasts/{bid}`: the author or a course admin; omitted keeps. */
export type CourseBroadcastPatchBody = { title?: string; body?: string }

export type CourseCreateBody = { title: string; slug: string; visibility: "public" | "invite" }
export type DraftMetaBody = { title: string; description: string; lock_version: number }
export type OutlineOpsBody = { ops: OutlineOp[]; lock_version: number }
export type StepCreateBody = { section_id: string; title: string; position?: number }
/** A `409` carries the other editor's draft in `params.theirs`. */
export type StepDraftBody = { content: StepContent; lock_version: number }
export type CheckpointBody = { label: string }
export type RestoreRevisionBody = { revision_id: string }
export type StepDiff = { live: StepContent | null; draft: StepContent }
/** A `409` (`lms/draft-changed`) means `draft_seq` changed since the pending list was loaded. */
export type PublishBody = { draft_seq: number; note?: string }
export type VersionCompareParams = { a: number; b: number }

export type CourseStaffBody = {
  login: string
  role: string
  /** Omitted: the backend applies the preset of `role` (B12). */
  permissions?: CourseStaffItem["permissions"]
  show_on_page?: boolean
  position?: number
}
export type CourseStaffPatchBody = Partial<Omit<CourseStaffBody, "login">>
export type CourseSettingsBody = {
  visibility?: "public" | "invite"
  status?: "active" | "archived"
  cover_file_id?: string | null
}
export type InviteCodeResponse = { invite_code: string }
