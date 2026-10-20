// Academic — classwork (backend § API contract → "Academic — classwork (B4)", Schemas and the attendance body addition).

import type { CommonWorkOffChoice, WorkOffChoice, WorkOffItem, WorkOffMode } from "./work-offs-staff"
import type { AttendanceState, DateRangeParams, PersonRef, SubjectRef } from "./common"
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
}

export type StudentAttendance = {
  from: string
  to: string
  summary: { subject: SubjectRef; absences: number; excused: number; lessons: number; rate: number | null }[]
  days: { date: string; absences: number }[]
  missed: { lesson: LessonItem; excused: boolean }[]
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
  homework: { text: string; due_date: string | null; due_auto: boolean } | null
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
    cells: { lesson_id: string; absent: boolean; late: boolean; excused: boolean; marks: number[] }[]
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

export type HomeworkListParams = { status?: "overdue" | "upcoming" | "later" | "done" }
export type HomeworkDoneBody = { done: boolean }
export type HomeworkNoteBody = { note: string | null }
export type StudentAttendanceParams = DateRangeParams

export type StaffHomeworkBody = { text: string; due_date?: string }
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
  teacher_id: string
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
