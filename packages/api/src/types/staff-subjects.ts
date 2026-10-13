// A teacher's subject group (or subgroup) and one student's record in it.
// TODO(contract): replace with generated

/** A student of the group; `subgroup` is null when none is assigned. */
export type TeachingRosterStudent = {
  user_id: string
  first_name: string
  last_name: string
  subgroup: number | null
}

/** A lesson of the subject for the group. */
export type TeachingLesson = {
  id: string
  date: string
  period: number
  starts_at: string
  ends_at: string
  room_name: string | null
  group_names: string[]
  status: "scheduled" | "cancelled"
  topic: string | null
  homework_text: string | null
  homework_due_date: string | null
}

/** GET /v1/staff/subjects/{subject_id}/groups/{group_id}[/subgroups/{n}]. `lessons` cover this week and the next three. */
export type TeachingGroup = {
  subject_id: string
  subject_name: string
  group_id: string
  group_name: string
  subgroup: number | null
  /** The subgroups the caller teaches in the group; empty when taught undivided. */
  subgroups: number[]
  students: TeachingRosterStudent[]
  lessons: TeachingLesson[]
}

/** One mark (2 to 5). */
export type TeachingMark = {
  semester: number
  type: string
  value: number
  date: string
  lesson_id: string | null
}

/** A homework of the subject and what the student did. */
export type TeachingHomework = {
  lesson_id: string
  date: string
  due_date: string | null
  text: string | null
  done_at: string | null
  note: string | null
}

/** A missed lesson of the subject. */
export type TeachingAbsence = {
  lesson_id: string
  date: string
  excused: boolean
}

/** GET .../students/{student_id}: marks of the newest semester (average on the 5-point scale), homework, attendance. */
export type TeachingStudent = {
  subject_id: string
  subject_name: string
  group_id: string
  group_name: string
  student: TeachingRosterStudent
  semester: number | null
  marks: TeachingMark[]
  average: number | null
  semester_mark: number | null
  homework: TeachingHomework[]
  absences: number
  lessons_with_attendance: number | null
  absent_lessons: TeachingAbsence[]
}
