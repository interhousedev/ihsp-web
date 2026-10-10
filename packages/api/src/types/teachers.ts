// "My teachers": teachers of the student's groups, and the teacher contacts edited by staff and admins.

/** A teacher's public contacts (all optional; the server trims and validates them). */
export type TeacherContacts = {
  /** Bare username, without `@`. */
  telegram: string | null
  email: string | null
  phone: string | null
  office_hours: string | null
  office: string | null
  note: string | null
}

export type TeacherLesson = {
  date: string
  /** ISO weekday: 1 Monday .. 7 Sunday. */
  weekday: number
  starts_at: string
  ends_at: string
  subject: string
  group: string | null
  room: string | null
}

export type MyTeacher = {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
  subjects: string[]
  contacts: TeacherContacts
  /** True while one of the teacher's lessons with the student's groups is running. */
  teaching_now: boolean
  current: TeacherLesson | null
  next: TeacherLesson | null
  /** The teacher's lessons with the student's groups this week, by time. */
  week: TeacherLesson[]
}
