// Academic — assessments (midterm and final controls) and the mark planner.
// Backend: `GET /v1/me/assessments`, `/v1/staff/assessments`, `/v1/admin/assessments`, `/v1/me/subjects/{id}/planner`.

import type { AudienceItem, ControlName, ControlPeriod } from "./schedule"
import type { PersonRef } from "./common"

export type AssessmentKind = "midterm" | "final" | "other"
/** `tentative`: the date is not confirmed by a teacher or Administration (EMIS outside a control week, a head student). */
export type AssessmentStatus = "planned" | "tentative" | "cancelled"
export type AssessmentSource = "teacher" | "admin" | "emis" | "head_student"

/**
 * A control of a subject. `days_left` counts from today to `date` (negative once past).
 * `has_date: false` is a control week no teacher has given this subject a date for yet: `date` is the week's start
 * (today while the week runs), `period` is the week and `id` is a stable derived id (not a stored row).
 */
export type AssessmentItem = {
  id: string
  subject: { id: string; name: string; short_name: string }
  kind: AssessmentKind
  title: string
  date: string
  starts_at: string | null
  lesson_id: string | null
  room: string | null
  status: AssessmentStatus
  source: AssessmentSource
  note: string | null
  days_left: number
  control: ControlName | null
  period: ControlPeriod | null
  has_date: boolean
}

export type AssessmentList = { items: AssessmentItem[] }

/** The staff and admin variant: with the audience and the author (`created_at`/`created_by` are null for a week without a date). */
export type StaffAssessmentItem = AssessmentItem & {
  audience: AudienceItem[]
  created_by: PersonRef | null
  created_at: string | null
  updated_at: string | null
}

export type StaffAssessmentList = { items: StaffAssessmentItem[] }

/** `?from=&to=&subject_id=` of the student calendar. */
export type AssessmentsParams = { from?: string; to?: string; subject_id?: string }

/** Staff and admin listings; without `status` cancelled controls are left out; `undated` adds control weeks without a date. */
export type StaffAssessmentsParams = AssessmentsParams & {
  group_id?: string
  kind?: AssessmentKind
  status?: AssessmentStatus
  source?: AssessmentSource
  undated?: boolean
}

/** A head student's suggestion for their own group (stays tentative). */
export type AssessmentProposalBody = {
  subject_id: string
  kind: AssessmentKind
  date: string
  title?: string
  starts_at?: string | null
  room?: string | null
  note?: string | null
  control?: ControlName | null
}

export type AssessmentCreateBody = {
  subject_id: string
  audience: { group_id: string; subgroup?: 1 | 2 | null }[]
  kind: AssessmentKind
  date: string
  title?: string
  starts_at?: string | null
  room?: string | null
  note?: string | null
  lesson_id?: string | null
  control?: ControlName | null
}

/**
 * Omitted fields stay; null clears `starts_at`, `room`, `note`, `lesson_id` and `control`.
 * `status: "planned"` confirms a tentative control as it is, `"cancelled"` dismisses it; any other change to a
 * tentative control confirms it.
 */
export type AssessmentPatchBody = Partial<Omit<AssessmentCreateBody, "audience">> & {
  audience?: AssessmentCreateBody["audience"]
  status?: "planned" | "cancelled"
}

// --- Mark planner ---

export type PlannerMarkType = "lesson" | "midterm" | "final"
export type PlannerControl = "midterm" | "final"
export type PlannerTargetStatus = "secured" | "needed" | "not_reachable" | "unknown"
/** What the numbers rest on; the page shows one line per code. */
export type PlannerAssumption =
  | "rounding"
  | "controls_per_semester"
  | "same_mark_on_remaining"
  | "pending_as_lesson_average"
  | "no_lesson_marks"
  | "what_if"

export type PlannerStat = { count: number; average: number | null }

export type PlannerTarget = {
  grade: 5 | 4 | 3
  /** The lowest semester mark that rounds to the grade (4.5 for a 5). */
  threshold: number
  status: PlannerTargetStatus
  /** One kind of control remaining: which one and the lowest mark each remaining one needs (`needed`). */
  control: PlannerControl | null
  min_value: number | null
  /** Both kinds remaining: the lowest mark that works on every remaining control, and the lowest final per midterm mark. */
  min_both: number | null
  pairs: { midterm: number; min_final: number | null }[]
}

export type SubjectPlanner = {
  subject: { id: string; name: string; short_name: string }
  semester: number
  lesson: PlannerStat
  midterm: PlannerStat
  final: PlannerStat
  /** ACA-15 on the marks (what-if included): the mean of the type means that have marks. */
  semester_mark: number | null
  /** Mark types that count in `semester_mark`, and those still missing ("final not yet"). */
  components: PlannerMarkType[]
  missing: PlannerMarkType[]
  /** Controls of the semester without a mark: 2 midterms and 1 final in all. */
  remaining: { midterm: number; final: number }
  pending: PlannerControl[]
  /** The mark if every remaining control gets the lesson average rounded to a whole mark. */
  predicted: { value: number | null; midterm: number | null; final: number | null }
  targets: PlannerTarget[]
  assumptions: PlannerAssumption[]
  what_if: { type: PlannerMarkType; value: number }[]
}

/** `?semester=` and repeated `what_if=<lesson|midterm|final>:<2..5>`. */
export type PlannerParams = { semester?: number; what_if?: string[] }
