// Academic — schedule (backend § API contract → "Academic — schedule (B3)" and Schemas).

import type { DateRangeParams, PageParams, PersonRef, RoomRefLite, SubjectRef } from "./common"

/** Who set a bell: Administration by hand, or the EMIS `class-hours` sync, which keeps its bells equal to EMIS. */
export type BellSource = "manual" | "emis"

export type Bell = {
  period: number
  /** "08:30" */
  start: string
  end: string
  /** 1..6 */
  weekdays: number[]
  source: BellSource
}

/** What a class is, from the EMIS class type. `midterm` and `final` are EMIS exam weeks. */
export type LessonKind = "lecture" | "practice" | "midterm" | "final" | "other"

/** Who wrote a lesson topic: `emis` = the topic EMIS sent (a hint), `manual` = a person; null = no topic. */
export type TopicSource = "emis" | "manual"

/** `emis`: imported from EMIS and kept equal to it; editing it by hand makes it `manual`. */
export type EntrySource = "manual" | "emis"

/** The control weeks Administration sets per term: two midterm controls and one final; unset ones are missing/null. */
export type ControlName = "midterm_1" | "midterm_2" | "final"
export type ControlPeriod = { start: string; end: string }
export type ControlPeriods = Partial<Record<ControlName, ControlPeriod | null>>

export type TermInput = {
  academic_year: string
  half: 1 | 2
  starts_on: string
  ends_on: string
  bells: Bell[]
  non_study_days: string[]
  moved_days: { date: string; follows_weekday: number }[]
  /** Optional on input (omitted = unchanged on PATCH, none on POST). */
  control_periods?: ControlPeriods
}

export type Term = Omit<TermInput, "control_periods"> & {
  id: string
  is_current: boolean
  control_periods: ControlPeriods
}

export type GroupItem = {
  id: string
  name: string
  slug: string
  current_semester: number | null
  status: "active" | "archived"
  students_count: number
  subgroups_assigned: number
  unregistered_count: number
  curator: PersonRef | null
  head_student: PersonRef | null
}

export type GroupStudent = {
  user_id: string
  first_name: string
  last_name: string
  subgroup: 1 | 2 | null
  status: "active" | "left"
  registered: boolean
}

export type GroupDetail = GroupItem & { emis_group_id: number | null; students: GroupStudent[] }

export type Subject = {
  id: string
  name: { uz: string; ru: string; en: string }
  short_name: string | null
  emis_subject_id: number | null
  can_be_divided: boolean
}

export type Room = {
  id: string
  slug: string
  name: string
  pin: string
  /** With `?pin=`. */
  url: string
  status: "active" | "archived"
  lessons_this_week: number
}

export type AudienceItem = { group_id: string; group_name: string; subgroup: 1 | 2 | null }

export type TimetableEntryInput = {
  term_id: string
  weekday: number
  period: number
  week_parity: "every" | "odd" | "even"
  subject_id: string
  teacher_id: string | null
  room_name: string | null
  audience: { group_id: string; subgroup: 1 | 2 | null }[]
  valid_from: string
  valid_to: string | null
}

export type TimetableEntry = {
  id: string
  term_id: string
  weekday: number
  period: number
  week_parity: "every" | "odd" | "even"
  subject: SubjectRef
  teacher: PersonRef | null
  room: RoomRefLite | null
  audience: AudienceItem[]
  valid_from: string
  valid_to: string | null
  source: EntrySource
}

export type Conflict = {
  kind: "teacher" | "room" | "audience"
  with_entry_id: string | null
  with_lesson_id: string | null
  description: string
  /** In which weeks the other entry runs; null when the clash is with a lesson. */
  week_parity: "every" | "odd" | "even" | null
}

export type LessonItem = {
  id: string
  date: string
  period: number
  starts_at: string
  ends_at: string
  subject: SubjectRef
  teacher: PersonRef | null
  room: RoomRefLite | null
  audience: AudienceItem[]
  status: "scheduled" | "cancelled"
  is_overridden: boolean
  changes: Record<string, [unknown, unknown]> | null
  topic: string | null
  kind: LessonKind
  topic_source: TopicSource | null
  has_homework: boolean
  attendance_submitted: boolean
}

export type ExtraLessonInput = {
  date: string
  period: number
  subject_id: string
  teacher_id: string | null
  room_name: string | null
  audience: { group_id: string; subgroup: 1 | 2 | null }[]
  topic?: string
}

export type StudentItem = {
  user_id: string
  login: string | null
  first_name: string
  last_name: string
  group: { id: string; name: string } | null
  subgroup: 1 | 2 | null
  status: string
  emis_status: string | null
  registered: boolean
  synced_at: string | null
}

export type ImportRow = {
  line: number
  last_name: string
  first_name: string
  middle_name: string | null
  group_name: string
  emis_student_id: number | null
  note: string | null
}

export type ImportPreview = {
  import_id: string
  new: ImportRow[]
  changed: ImportRow[]
  unchanged: number
  conflicts: ImportRow[]
}

export type StudentProfile = {
  user_id: string
  login: string | null
  first_name: string
  last_name: string
  mailbox: string | null
  group: { id: string; name: string }
  subgroup: 1 | 2 | null
  curator: PersonRef | null
  head_student: PersonRef | null
  current_semester: number | null
  emis_status: string | null
  synced_at: string | null
}

// --- Request bodies and query parameters ---

export type TermPatch = Partial<TermInput>

export type GroupCreateBody = { name: string; emis_group_id?: number; current_semester?: number }
export type GroupPatchBody = {
  curator_id?: string | null
  head_student_id?: string | null
  status?: "active" | "archived"
}
export type AdminGroupsParams = { status?: "active" | "archived" }

export type SubgroupAssignmentsBody = {
  assignments: { user_id: string; subgroup: 1 | 2 | null }[]
}

export type SubjectCreateBody = {
  name: { uz: string; ru: string; en: string }
  short_name?: string
  emis_subject_id?: number
  can_be_divided?: boolean
}
export type SubjectPatchBody = Partial<SubjectCreateBody>
export type AdminSubjectsParams = { query?: string }

export type AdminRoomsParams = { status?: "active" | "archived" }
export type RoomRenameBody = { name: string }
export type RoomMergeBody = { into_room_id: string }

/** `group_id`, `teacher_id` and `room_id` are alternatives. */
export type AdminTimetableParams = {
  term_id: string
  group_id?: string
  teacher_id?: string
  room_id?: string
}
export type TimetableCheckResult = { conflicts: Conflict[] }
export type TimetablePatchBody = Partial<TimetableEntryInput>
export type TimetableCopyBody = { from_term_id: string; to_term_id: string }
export type TimetableCopyResult = { created: number }

export type AdminLessonsParams = PageParams & {
  from?: string
  to?: string
  group_id?: string
  teacher_id?: string
  room_id?: string
  status?: "scheduled" | "cancelled"
  teacher_needed?: boolean
}
export type LessonPatchBody = {
  status?: "scheduled" | "cancelled"
  teacher_id?: string | null
  subject_id?: string
  room_name?: string | null
  date?: string
  period?: number
  topic?: string | null
}

export type AdminStudentsParams = PageParams & {
  query?: string
  group_id?: string
  subgroup?: 1 | 2
  status?: "active" | "left"
  emis_status?: "active" | "needs_reauth"
  registered?: boolean
}
export type ImportConfirmResult = { created: number; updated: number; skipped: number }

export type TimetableRangeParams = DateRangeParams
