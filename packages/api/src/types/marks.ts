// Academic — marks and sync (backend § API contract → "Academic — marks and sync (B5)" and Schemas).

import type { AttendanceState, PageParams, PersonRef, SubjectRef } from "./common"
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
  teachers: PersonRef[]
  semester_mark: number | null
  emis_rating: number | null
  absences: number
  next_lesson: LessonItem | null
}

export type SubjectDetail = {
  subject: SubjectRef
  semester: number
  teachers: PersonRef[]
  averages: { lesson: number | null; midterm: number | null; final: number | null }
  semester_mark: number | null
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
    subjects: { subject: SubjectRef; semester_mark: number | null; emis_rating: number | null }[]
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
