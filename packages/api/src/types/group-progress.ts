// TODO(contract): hand-written until `bun run sync:openapi` brings GroupProgress.

export type GroupProgressSubject = { id: string; name: string; short_name: string }

export type GroupProgressCell = {
  subject_id: string
  semester_mark: number | null
  midterm_avg: number | null
  final_avg: number | null
  lesson_avg: number | null
  emis_rating: number | null
  marks_count: number
  absences: number
  lessons: number
  /** A fraction from 0 to 1. */
  absence_rate: number | null
}

export type GroupProgressStudent = {
  student: { id: string; first_name: string; last_name: string }
  gpa: number | null
  absences: number
  lessons: number
  absence_rate: number | null
  cells: GroupProgressCell[]
}

export type GroupProgress = {
  group_id: string
  group_name: string
  semester: number | null
  semesters: number[]
  subjects: GroupProgressSubject[]
  students: GroupProgressStudent[]
}
