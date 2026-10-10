// "My teachers": teachers of the student's groups, their timetable, and the teacher contacts and photos.

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

/** A subject the teacher teaches the student; `id` opens the subject page. */
export type TeacherSubjectRef = { id: string; name: string }

/** One lesson with the student's groups, as the student's teacher list shows it. */
export type TeacherLesson = {
  date: string
  /** ISO weekday: 1 Monday .. 7 Sunday. */
  weekday: number
  starts_at: string
  ends_at: string
  subject_id: string
  subject: string
  group: string | null
  room: string | null
  /** The lesson page id; null for a class that is not a stored lesson yet. */
  lesson_id: string | null
}

export type MyTeacher = {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
  /** Link to the photo, valid for an hour; null when there is none. */
  photo_url: string | null
  /** Subject names, kept for compatibility; the same subjects as `subject_refs`. */
  subjects: string[]
  /** The same subjects with ids, sorted by name. */
  subject_refs: TeacherSubjectRef[]
  contacts: TeacherContacts
  /** True while one of the teacher's lessons with the student's groups is running. */
  teaching_now: boolean
  current: TeacherLesson | null
  next: TeacherLesson | null
  /** The teacher's lessons with the student's groups this week (Monday to Friday), by time. */
  week: TeacherLesson[]
  /** The teacher's lessons with the student's groups from today through the next 14 days (Monday to Friday), by time. */
  upcoming: TeacherLesson[]
}

/** `GET /v1/me/teachers/{teacher_id}/timetable`: ISO dates, inclusive; the server defaults to the current week. */
export type TeacherTimetableParams = { from?: string; to?: string }

/** One lesson of a teacher in any group, for the teacher's timetable. No student data is included. */
export type TeacherSlot = {
  id: string
  date: string
  starts_at: string
  ends_at: string
  subject_id: string
  subject_name: string
  room: string | null
  /** The audience group label, e.g. "10-A". */
  group: string | null
  /** True when the lesson is for the student's own group. */
  mine: boolean
  status: string
  /** The lesson page id; set only for the student's own group's stored lessons. */
  lesson_id: string | null
}

/** Result of uploading or removing a profile photo; `photo_url` is null after a removal. */
export type UserPhotoResponse = { photo_url: string | null }
