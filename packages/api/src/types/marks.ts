// Academic — marks and sync (backend § API contract → "Academic — marks and sync (B5)" and Schemas).

import type { AttendanceState, PageParams, PersonRef, SubjectRef } from "./common"

/** A teacher of a subject: the person with the photo link (the student marks view). */
export type SubjectTeacher = PersonRef & { photo_url: string | null }
import type { ResourceItem } from "./links"
import type { LessonItem } from "./schedule"

export type MarkItem = {
  subject: SubjectRef
  semester: number
  type: "lesson" | "midterm" | "final"
  value: number
  date: string
  lesson_id: string | null
}

export type SubjectCard = {
  subject: SubjectRef
  teachers: SubjectTeacher[]
  semester_mark: number | null
  /** GPA counting temporary marks not yet in EMIS; null when there are none. */
  gpa_with_temporary?: number | null
  emis_rating: number | null
  absences: number
  next_lesson: LessonItem | null
}

export type SubjectDetail = {
  subject: SubjectRef
  semester: number
  teachers: SubjectTeacher[]
  averages: { lesson: number | null; midterm: number | null; final: number | null }
  semester_mark: number | null
  /** GPA counting temporary marks not yet in EMIS; null when there are none. */
  gpa_with_temporary?: number | null
  emis_rating: number | null
  absence_rate: number | null
  lessons: (LessonItem & {
    marks: MarkItem[]
    attendance: AttendanceState
    homework_text: string | null
  })[]
  marks: MarkItem[]
  materials: ResourceItem[]
}

/** One mark placed on a lesson of the subject hub list (all marks of the lesson, not only the first). */
export type SubjectLessonMark = { type: "lesson" | "midterm" | "final"; value: number }

export type SubjectLessonRow = {
  lesson_id: string
  date: string
  starts_at: string
  kind: LessonItem["kind"]
  topic: string | null
  marks: SubjectLessonMark[]
  attendance: "present" | "absent" | "late" | null
  materials_count: number
  past: boolean
}

export type LessonResult = {
  lesson_id: string
  attendance: "present" | "absent" | "late" | null
  mark: number | null
}

export type SubjectLessonList = { items: SubjectLessonRow[]; has_more_past: boolean }

/** `around=now`: the latest `past_limit` past lessons (after `past_offset`), then the next `upcoming_days` days. */
export type SubjectLessonsParams = {
  around?: "now"
  semester?: number
  past_limit?: number
  past_offset?: number
  upcoming_days?: number
}

export type SemesterGrades = {
  semester: number
  gpa: number | null
  synced_at: string | null
  rows: {
    subject: SubjectRef
    lesson_avg: number | null
    midterm_avg: number | null
    final_avg: number | null
    semester_mark: number | null
    gpa_with_temporary?: number | null
    emis_rating: number | null
    marks_count: number
  }[]
}

export type DayGrades = {
  date: string
  lessons: { lesson: LessonItem; marks: MarkItem[] }[]
  unmatched: MarkItem[]
}

export type RecordBook = {
  semesters: {
    semester: number
    gpa: number | null
    subjects: {
      subject: SubjectRef
      semester_mark: number | null
      gpa_with_temporary?: number | null
      emis_rating: number | null
    }[]
  }[]
}

export type SyncRunItem = {
  id: string
  started_at: string
  finished_at: string | null
  status: string
  stats: Record<string, number>
}

// --- Query parameters and bodies ---

export type SemesterParams = { semester?: number }
export type SyncRunsParams = Pick<PageParams, "cursor" | "limit">
/** Manual run: one student (`academic.sync_student`) or everyone (`academic.sync_all`). */
export type SyncRunBody = { user_id?: string }

/** One academic year and its half, e.g. `2026-2027` / 1. TODO(contract): replace with generated */
export type TermChoice = { academic_year: string; half: 1 | 2 }

/** Body of `POST /v1/admin/sync/materials`. TODO(contract): replace with generated */
export type ResyncMaterialsBody = { terms: TermChoice[] }

/** A teacher or a group that has the subject this term. TODO(contract): replace with generated */
export type SubjectPerson = { id: string; name: string }

/** `GET /v1/admin/subjects/{id}/people` — who teaches it, which groups have it. TODO(contract): replace with generated */
export type SubjectPeople = { teachers: SubjectPerson[]; groups: SubjectPerson[] }

/**
 * Body of `POST /v1/admin/subjects/{id}/emis-pull`: `full` replaces the subject's EMIS materials, `soft` only fills
 * lessons without any material (nothing deleted). No `terms` = the current term. TODO(contract): replace with generated
 */
export type SubjectEmisPullBody = {
  mode?: "full" | "soft"
  teacher_id?: string
  group_id?: string
  terms?: TermChoice[]
}
