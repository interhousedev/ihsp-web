// Academic — classwork (backend § API contract → "Academic — classwork (B4)", Schemas and the attendance body addition).

import type { CommonWorkOffChoice, WorkOffChoice, WorkOffItem, WorkOffMode } from "./work-offs-staff"
import type { AttendanceState, DateRangeParams, ExcuseRef, PersonRef, SubjectRef } from "./common"
import type { ResourceItem } from "./links"
import type { MarkItem } from "./marks"
import type { GroupStudent, LessonItem } from "./schedule"

export type HomeworkItem = {
  lesson_id: string
  subject: SubjectRef
  teacher: PersonRef | null
  text: string
  due_date: string | null
  given_on: string
  /** Whole days an open item is past its due date (Asia/Tashkent); 0 when done, undated or not late yet. */
  days_overdue: number
  updated: boolean
  done_at: string | null
  note: string | null
  /** What the student handed in; `null` (or absent in older responses) when nothing was submitted. */
  submission?: HomeworkSubmissionSummary | null
  /** Who gave the homework; `null` on a lesson page without homework. `text` is empty for `emis` only. */
  source: HomeworkSource | null
  /** The EMIS topic text. */
  topic: string | null
  /** The EMIS homework files. */
  emis_files: ResourceItem[]
  accepts_submissions: boolean
}

export type HomeworkSource = "teacher" | "emis" | "both"
export type HomeworkReviewStatus = "pending" | "returned" | "graded"

export type HomeworkSubmissionStatus = "submitted" | "late"

/** `GET /v1/me/homework` item field: the status of the student's submission. */
export type HomeworkSubmissionSummary = {
  status: HomeworkSubmissionStatus
  file_count: number
  submitted_at: string
  review_status: HomeworkReviewStatus
  grade: number | null
}

export type HomeworkSubmissionFile = { id: string; name: string; size: number; content_type: string }

/** The student's own submission (`/v1/me/homework/{lesson_id}/submission`). */
export type HomeworkSubmission = {
  lesson_id: string
  status: HomeworkSubmissionStatus
  comment: string | null
  files: HomeworkSubmissionFile[]
  submitted_at: string
  text: string | null
  review_status: HomeworkReviewStatus
  grade: number | null
  teacher_comment: string | null
  previous_comment: string | null
  reviewed_at: string | null
  reviewer: PersonRef | null
}

/** Body of `PUT /v1/me/homework/{lesson_id}/submission`: a text answer, up to 10 file ids or both; empty → 422. */
export type HomeworkSubmissionBody = { file_ids?: string[]; text?: string | null; comment?: string | null }

export type StaffSubmissionFile = HomeworkSubmissionFile & { download_url: string }

export type StaffSubmissionRow = {
  /** The submission id; null when the student handed nothing in. */
  id: string | null
  student: PersonRef
  group_name: string
  subgroup: number | null
  status: HomeworkSubmissionStatus | "missing"
  submitted_at: string | null
  comment: string | null
  files: StaffSubmissionFile[]
  text: string | null
  review_status: HomeworkReviewStatus
  grade: number | null
  teacher_comment: string | null
  previous_comment: string | null
  reviewed_at: string | null
  reviewer: PersonRef | null
}

/** Body of `PUT /v1/staff/homework/submissions/{id}/review`: grade 2..5 (also a temporary mark) or return with a comment. */
export type HomeworkReviewBody =
  | { action: "grade"; grade: number; comment?: string }
  | { action: "return"; comment: string }

/** The teacher's view of a lesson's homework submissions. */
export type LessonHomeworkSubmissions = {
  lesson_id: string
  counts: {
    submitted: number
    late: number
    missing: number
    to_review: number
    returned: number
    graded: number
    total: number
  }
  students: StaffSubmissionRow[]
}

export type StudentToday = {
  now_or_next: (LessonItem & { minutes_left: number | null; materials_count: number }) | null
  lessons: (LessonItem & { state: "done" | "now" | "next" | "later" | "cancelled" })[]
  next_study_day: string | null
  /** Homework to do: overdue items first (oldest due date first), then the items due by the next study day. */
  due: HomeworkItem[]
  new_marks: MarkItem[]
  semester: { semester: number | null; gpa: number | null; gpa_change: number | null; absences: number }
  synced_at: string | null
}

export type StudentLesson = {
  lesson: LessonItem
  materials: ResourceItem[]
  attachments: ResourceItem[]
  homework: HomeworkItem | null
  my_mark: MarkItem[]
  my_attendance: AttendanceState
  can_attach: boolean
  /** Files the teacher attached to the homework (role `homework`). */
  homework_files?: ResourceItem[]
}

export type StudentAttendance = {
  from: string
  to: string
  summary: { subject: SubjectRef; absences: number; excused: number; lessons: number; rate: number | null }[]
  days: { date: string; absences: number }[]
  missed: { lesson: LessonItem; excused: boolean; excuse: ExcuseRef | null }[]
  not_taken: number
}

export type StaffToday = {
  now_or_next: LessonItem | null
  lessons: (LessonItem & { attendance_missing: boolean; homework_missing: boolean })[]
  needs_attention: LessonItem[]
}

export type RosterItem = {
  position: number
  user_id: string
  first_name: string
  last_name: string
  group_name: string
  subgroup_unset: boolean
  absent: boolean
  /** Came late: counts as present for every rate. */
  late: boolean
  excused: boolean
  excuse_comment: string | null
  /**
   * Backend addition to the contract (B4): false for a student without a subgroup who is not part of the saved
   * audience yet (counted only once the teacher marks them); always true for students with a subgroup.
   */
  counted: boolean
}

export type AttendanceSheet = {
  lesson_id: string
  submitted: boolean
  version: number
  editable: boolean
  roster: RosterItem[]
  submitted_at: string | null
  submitted_by: PersonRef | null
  /** The lesson's work-offs of absent students (WO-3); absent from older responses. */
  work_offs?: WorkOffItem[]
}

export type StaffLesson = {
  lesson: LessonItem
  materials: ResourceItem[]
  attachments: ResourceItem[]
  homework: {
    text: string
    due_date: string | null
    due_auto: boolean
    submissions?: { submitted: number; total: number } | null
    source: HomeworkSource
    accept_submissions: boolean
    /** `null` follows the teacher's own setting; `notify_effective` is the value in force. */
    notify: boolean | null
    notify_effective: boolean
    emis_files: ResourceItem[]
    emis_topic_description: string | null
  } | null
  attendance: AttendanceSheet
}

export type Journal = {
  subject: SubjectRef
  audience_key: string
  lessons: {
    id: string
    date: string
    topic: string | null
    attendance_submitted: boolean
    editable: boolean
    version: number
  }[]
  students: {
    user_id: string
    first_name: string
    last_name: string
    cells: {
      lesson_id: string
      absent: boolean
      late: boolean
      excused: boolean
      excuse: ExcuseRef | null
      marks: number[]
      /** A temporary mark the teacher gave, not in EMIS yet (null when none). */
      temporary_mark: { value: number; comment: string | null } | null
    }[]
    absences: number
    lates: number
    semester_mark: number | null
  }[]
}

export type AttendanceReport = {
  view: string
  from: string
  to: string
  rows: {
    key: string
    label: string
    absences: number
    excused: number
    lessons: number
    rate: number | null
    not_taken: number
  }[]
}

export type CuratorStudent = GroupStudent & {
  absence_rate: number | null
  gpa: number | null
  flags: ("absences" | "gpa_drop" | "no_subgroup")[]
}

// --- Request bodies and query parameters ---

export type HomeworkListParams = {
  status?: "overdue" | "upcoming" | "later" | "done"
  subject_id?: string
  /** Keeps the homework due in this range (inclusive), by due date. */
  from?: string
  to?: string
}
export type HomeworkDoneBody = { done: boolean }
export type HomeworkNoteBody = { note: string | null }
export type StudentAttendanceParams = DateRangeParams

/** `text` may be omitted when the lesson has EMIS homework; an omitted `accept_submissions` keeps the switch. */
export type StaffHomeworkBody = { text?: string | null; due_date?: string | null; accept_submissions?: boolean | null }

export type HomeworkSettings = { accept_by_default: boolean; notify_on_submission: boolean }
/** Body of `PUT /v1/staff/homework/settings`; an omitted field is kept. */
export type HomeworkSettingsBody = Partial<HomeworkSettings>
/** Body of `PATCH /v1/staff/lessons/{id}/homework/settings`; `notify: null` follows the teacher's setting again. */
export type LessonHomeworkSwitchesBody = { accept_submissions?: boolean; notify?: boolean | null }

export type HomeworkBoardOnly = "all" | "with_homework" | "to_review"
export type HomeworkBoardParams = {
  subject_id: string
  audience_key: string
  from?: string
  to?: string
  only?: HomeworkBoardOnly
}
export type HomeworkBoardLesson = {
  lesson_id: string
  date: string
  period: number
  topic: string | null
  emis_topic_description: string | null
  emis_files: ResourceItem[]
  homework: { text: string; due_date: string | null; due_auto: boolean; source: HomeworkSource } | null
  accept_submissions: boolean
  notify: boolean | null
  notify_effective: boolean
  counts: { submitted: number; late: number; missing: number; to_review: number; graded: number; total: number } | null
}
/** `GET /v1/staff/homework`: the lessons of one journal option, newest first. */
export type HomeworkBoard = {
  subject: SubjectRef
  audience_key: string
  label: string
  lessons: HomeworkBoardLesson[]
  settings: HomeworkSettings
}
export type StaffTopicBody = { topic: string }

/** `present_unassigned` lists students without a subgroup who attended a subgroup lesson (ACA-2). */
export type AttendanceSubmitBody = {
  absent: string[]
  late: string[]
  present_unassigned: string[]
  base_version: number
  /** Omitted means `per_student`; `work_offs` lists only the absent students whose choice changed. */
  work_off_mode?: WorkOffMode
  work_offs?: WorkOffChoice[]
  common_work_off?: CommonWorkOffChoice | null
}
export type AttendanceExcuseBody = { student_id: string; excused: boolean; comment?: string }

export type JournalParams = { subject_id: string; audience_key: string; term_id?: string }
export type JournalOption = { subject: SubjectRef; audience_key: string; label: string }
export type JournalToggleBody = {
  lesson_id: string
  student_id: string
  absent: boolean
  late?: boolean
  base_version: number
}
export type JournalToggleResult = { attendance_version: number }

export type GroupAttendanceView = "student" | "subject" | "day" | "lesson"
export type GroupAttendanceParams = { view: GroupAttendanceView; from?: string; to?: string }

export type AdminAttendanceView = "group" | "student" | "subject" | "teacher"
export type AdminAttendanceParams = {
  view: AdminAttendanceView
  from?: string
  to?: string
  group_id?: string
}
export type MissingAttendanceParams = DateRangeParams
export type MissingAttendanceItem = { teacher: PersonRef; lessons: LessonItem[] }

/** A temporary mark (2 to 5) a teacher gave in a lesson; it is not in EMIS yet. */
export type TemporaryMark = {
  id: string
  lesson_id: string
  lesson_date: string
  lesson_period: number
  student_id: string
  student_name: string
  group_id: string | null
  group_name: string
  subject_id: string
  subject_name: string
  teacher_id: string | null
  teacher_name: string
  value: number
  comment: string | null
  author_id: string
  created_at: string
  updated_at: string
}

/** Temporary marks, oldest lesson first. */
export type TemporaryMarkList = { items: TemporaryMark[] }

/** PUT /v1/staff/lessons/{id}/temporary-marks/{student_id}. */
export type TemporaryMarkBody = { value: number; comment?: string | null }
