import type {
  AttendanceReport,
  AttendanceSheet,
  CuratorStudent,
  HomeworkItem,
  Journal,
  JournalOption,
  LessonItem,
  MissingAttendanceItem,
  StaffLesson,
  StaffToday,
  TemporaryMark,
  StudentAttendance,
  StudentLesson,
  StudentToday,
} from "@ihsp/api"
import { groupStudents } from "./schedule"
import { newMarks, marks } from "./marks"
import { resourceAttachment, resourceItems } from "./links"
import {
  FIXTURE_NOW,
  FIXTURE_TODAY,
  FIXTURE_TOMORROW,
  atTashkent,
  bellOf,
  findLesson,
  ids,
  lessonId,
  makeLesson,
  persons,
  subjectRefs,
  teacherOf,
  todayLessons,
  uuid,
  weekLessons,
} from "./world"
import type { Slot, SubjectKey } from "./world"

// --- Homework ---

export const homeworkMath: HomeworkItem = {
  lesson_id: lessonId(2, 2),
  subject: subjectRefs.math,
  teacher: teacherOf.math,
  text: "Exercises 5.3 (a)-(f) on page 41",
  due_date: FIXTURE_TOMORROW,
  given_on: "2026-10-06",
  days_overdue: 0,
  updated: false,
  done_at: null,
  note: null,
}

export const homeworkPhysics: HomeworkItem = {
  lesson_id: ids.lessonPhysicsToday,
  subject: subjectRefs.physics,
  teacher: teacherOf.physics,
  text: "Solve problems 14-17 on page 52",
  due_date: "2026-10-09",
  given_on: FIXTURE_TODAY,
  days_overdue: 0,
  updated: true,
  done_at: null,
  note: null,
}

export const homeworkEnglish: HomeworkItem = {
  lesson_id: lessonId(2, 4),
  subject: subjectRefs.english,
  teacher: teacherOf.english,
  text: "Write a 150-word essay about your city",
  due_date: FIXTURE_TOMORROW,
  given_on: "2026-10-06",
  days_overdue: 0,
  updated: false,
  done_at: "2026-10-06T15:00:00Z",
  note: "Draft is in my notebook",
}

export const homeworkChemistry: HomeworkItem = {
  lesson_id: lessonId(2, 1),
  subject: subjectRefs.chemistry,
  teacher: teacherOf.chemistry,
  text: "Learn the periodic table groups 1-3",
  due_date: "2026-10-12",
  given_on: "2026-10-06",
  days_overdue: 0,
  updated: false,
  done_at: null,
  note: null,
}

export const homeworkHistory: HomeworkItem = {
  lesson_id: lessonId(1, 4),
  subject: subjectRefs.history,
  teacher: teacherOf.history,
  text: "Read chapter 6",
  due_date: FIXTURE_TODAY,
  given_on: "2026-10-05",
  days_overdue: 0,
  updated: false,
  done_at: "2026-10-06T18:00:00Z",
  note: null,
}

/** Open and past due: given on Monday for Tuesday, so it is one day overdue on the fixture Wednesday. */
export const homeworkOverdue: HomeworkItem = {
  lesson_id: lessonId(1, 2),
  subject: subjectRefs.physics,
  teacher: teacherOf.physics,
  text: "Learn the formulas of the lesson on waves",
  due_date: "2026-10-06",
  given_on: "2026-10-05",
  days_overdue: 1,
  updated: false,
  done_at: null,
  note: null,
}

export const homeworkItems: HomeworkItem[] = [
  homeworkOverdue,
  homeworkMath,
  homeworkPhysics,
  homeworkEnglish,
  homeworkChemistry,
  homeworkHistory,
]

/**
 * `overdue` is open and due before today; `upcoming` is open and due from today up to the next study day; `later` is
 * open and due after it (or undated); `done` has `done_at`. Every item is in exactly one of them.
 */
export function homeworkByStatus(status: "overdue" | "upcoming" | "later" | "done" | null): HomeworkItem[] {
  return homeworkItems.filter((item) => {
    const done = item.done_at !== null
    const open = !done
    const due = item.due_date
    if (status === "done") return done
    if (status === "overdue") return open && due !== null && due < FIXTURE_TODAY
    if (status === "upcoming") return open && due !== null && due >= FIXTURE_TODAY && due <= FIXTURE_TOMORROW
    if (status === "later") return open && (due === null || due > FIXTURE_TOMORROW)
    return true
  })
}

// --- Student today ---

const lessonStates = ["done", "done", "next", "later", "later", "later"] as const

export const studentToday: StudentToday = {
  now_or_next: (() => {
    const lesson = todayLessons[2]
    if (!lesson) throw new Error("fixture: today has no third lesson")
    return { ...lesson, minutes_left: 8, materials_count: 2 }
  })(),
  lessons: todayLessons.map((lesson, index) => ({ ...lesson, state: lessonStates[index] ?? "later" })),
  next_study_day: FIXTURE_TOMORROW,
  due: [homeworkOverdue, homeworkMath],
  new_marks: newMarks,
  semester: { semester: 4, gpa: 4.1, gpa_change: 0.2, absences: 5 },
  synced_at: "2026-10-07T01:00:00Z",
}

// --- Student lesson ---

/** Lesson page for any lesson of the fixture week; the physics lesson of today has materials and attachments. */
export function studentLessonFor(id: string): StudentLesson | undefined {
  const lesson = findLesson(id)
  if (!lesson) return undefined
  const isPhysicsToday = lesson.id === ids.lessonPhysicsToday
  const past = lesson.date < FIXTURE_TODAY
  return {
    lesson,
    materials: isPhysicsToday ? resourceItems.filter((item) => item.role === "material") : [],
    attachments: isPhysicsToday ? [resourceAttachment] : [],
    homework: homeworkItems.find((item) => item.lesson_id === lesson.id) ?? null,
    my_mark: marks.filter((item) => item.lesson_id === lesson.id),
    my_attendance: past ? "present" : "not_taken",
    can_attach: lesson.date >= FIXTURE_TODAY,
  }
}

// --- Student attendance ---

function pastLesson(n: number, date: string, subject: SubjectKey, period: number): LessonItem {
  const slot: Slot = { weekday: 1, period, subject, room: "r101", subgroup: null }
  const bell = bellOf(period)
  return {
    ...makeLesson(slot),
    id: uuid(5, 900 + n),
    date,
    starts_at: atTashkent(date, bell.start),
    ends_at: atTashkent(date, bell.end),
    attendance_submitted: true,
  }
}

export const studentAttendance: StudentAttendance = {
  from: "2026-09-02",
  to: FIXTURE_TODAY,
  summary: [
    { subject: subjectRefs.math, absences: 2, excused: 0, lessons: 14, rate: 0.14 },
    { subject: subjectRefs.physics, absences: 0, excused: 0, lessons: 12, rate: 0 },
    { subject: subjectRefs.english, absences: 1, excused: 0, lessons: 10, rate: 0.1 },
    { subject: subjectRefs.informatics, absences: 0, excused: 0, lessons: 8, rate: 0 },
    { subject: subjectRefs.chemistry, absences: 1, excused: 0, lessons: 9, rate: 0.11 },
    { subject: subjectRefs.history, absences: 1, excused: 1, lessons: 9, rate: 0.11 },
  ],
  days: [
    { date: "2026-09-09", absences: 1 },
    { date: "2026-09-23", absences: 2 },
    { date: "2026-09-30", absences: 1 },
    { date: "2026-10-06", absences: 1 },
  ],
  missed: [
    { lesson: pastLesson(1, "2026-10-06", "chemistry", 1), excused: false },
    { lesson: pastLesson(2, "2026-09-30", "english", 3), excused: false },
    { lesson: pastLesson(3, "2026-09-23", "math", 1), excused: false },
    { lesson: pastLesson(4, "2026-09-23", "history", 4), excused: true },
    { lesson: pastLesson(5, "2026-09-09", "math", 2), excused: false },
  ],
  not_taken: 1,
}

// --- Staff (teacher Kalandarova, curator of 2TN2) ---

export const attendanceSheet: AttendanceSheet = {
  lesson_id: ids.lessonPhysicsToday,
  submitted: false,
  version: 3,
  editable: true,
  roster: groupStudents.map((student, index) => ({
    position: index,
    user_id: student.user_id,
    first_name: student.first_name,
    last_name: student.last_name,
    group_name: "2TN2",
    subgroup_unset: student.subgroup === null,
    absent: false,
    late: false,
    excused: false,
    excuse_comment: null,
    counted: student.subgroup !== null,
  })),
  submitted_at: null,
  submitted_by: null,
}

/** A submitted sheet with one absence, for the lessons of days that have already ended. */
export const attendanceSheetSubmitted: AttendanceSheet = {
  ...attendanceSheet,
  submitted: true,
  version: 4,
  roster: attendanceSheet.roster.map((item, index) =>
    index === 1 ? { ...item, absent: true, counted: true } : { ...item, counted: true },
  ),
  submitted_at: "2026-10-06T08:00:00Z",
  submitted_by: persons.kalandarova,
}

/** The same sheet when the 7-day window has passed. */
export const attendanceSheetClosed: AttendanceSheet = { ...attendanceSheetSubmitted, editable: false }

export function staffLessonFor(id: string): StaffLesson | undefined {
  const lesson = findLesson(id)
  if (!lesson) return undefined
  const isPhysicsToday = lesson.id === ids.lessonPhysicsToday
  const homework = homeworkItems.find((item) => item.lesson_id === lesson.id)
  const sheet = lesson.date < FIXTURE_TODAY ? attendanceSheetSubmitted : attendanceSheet
  return {
    lesson,
    materials: isPhysicsToday ? resourceItems.filter((item) => item.role === "material") : [],
    attachments: isPhysicsToday ? [resourceAttachment] : [],
    homework: homework ? { text: homework.text, due_date: homework.due_date, due_auto: isPhysicsToday } : null,
    attendance: { ...sheet, lesson_id: lesson.id },
  }
}

const needsAttentionLesson: LessonItem = {
  ...makeLesson({ weekday: 1, period: 2, subject: "physics", room: "r102", subgroup: null }),
  attendance_submitted: false,
}

export const staffToday: StaffToday = {
  now_or_next: todayLessons.find((lesson) => lesson.id === ids.lessonPhysicsToday) ?? null,
  lessons: todayLessons
    .filter((lesson) => lesson.teacher?.id === ids.teacherKalandarova)
    .map((lesson) => ({ ...lesson, attendance_missing: false, homework_missing: false })),
  needs_attention: [needsAttentionLesson],
}

export const journalOptions: JournalOption[] = [
  { subject: subjectRefs.physics, audience_key: "2tn2", label: "2TN2" },
  { subject: subjectRefs.english, audience_key: "2tn2:1", label: "2TN2 subgroup 1" },
]

const physicsLessons = weekLessons.filter((lesson) => lesson.subject.id === ids.physics)

export const journal: Journal = {
  subject: subjectRefs.physics,
  audience_key: "2tn2",
  lessons: physicsLessons.map((lesson) => ({
    id: lesson.id,
    date: lesson.date,
    topic: lesson.topic,
    attendance_submitted: lesson.attendance_submitted,
    editable: true,
    version: 3,
  })),
  students: groupStudents.map((student, index) => ({
    user_id: student.user_id,
    first_name: student.first_name,
    last_name: student.last_name,
    cells: physicsLessons.map((lesson) => ({
      lesson_id: lesson.id,
      absent: index === 1 && lesson.date === "2026-10-05",
      late: false,
      excused: false,
      marks: index === 0 && lesson.date === "2026-10-05" ? [4] : [],
    })),
    absences: index === 1 ? 1 : 0,
    lates: 0,
    semester_mark: index === 0 ? 4.8 : null,
  })),
}

export const groupAttendanceReport: AttendanceReport = {
  view: "student",
  from: "2026-09-02",
  to: FIXTURE_TODAY,
  rows: groupStudents.map((student, index) => ({
    key: student.user_id,
    label: `${student.last_name} ${student.first_name}`,
    absences: [5, 1, 0, 0][index] ?? 0,
    excused: [1, 0, 0, 0][index] ?? 0,
    lessons: 60,
    rate: [0.08, 0.02, 0, 0][index] ?? 0,
    not_taken: index === 0 ? 1 : 0,
  })),
}

export const adminAttendanceReport: AttendanceReport = {
  view: "group",
  from: "2026-09-02",
  to: FIXTURE_TODAY,
  rows: [
    { key: ids.group2TN2, label: "2TN2", absences: 6, excused: 1, lessons: 240, rate: 0.03, not_taken: 1 },
    { key: ids.group1TN1, label: "1TN1", absences: 0, excused: 0, lessons: 0, rate: null, not_taken: 0 },
  ],
}

export const curatorStudents: CuratorStudent[] = groupStudents.map((student, index) => ({
  ...student,
  absence_rate: [0.08, 0.02, 0, null][index] ?? null,
  gpa: [4.1, 3.4, 4.8, null][index] ?? null,
  flags: index === 0 ? ["absences"] : index === 1 ? ["gpa_drop"] : index === 3 ? ["no_subgroup"] : [],
}))

export const missingAttendance: MissingAttendanceItem[] = [
  { teacher: persons.yusupov, lessons: [{ ...needsAttentionLesson, teacher: persons.yusupov }] },
]

/** Temporary marks Kalandarova gave in today's Physics lesson; not in EMIS yet. */
export const temporaryMarks: TemporaryMark[] = [
  {
    id: "00000000-0000-7000-8000-000000000071",
    lesson_id: ids.lessonPhysicsToday,
    lesson_date: FIXTURE_TODAY,
    lesson_period: 3,
    student_id: ids.student,
    student_name: `${persons.student.last_name} ${persons.student.first_name}`,
    group_id: ids.group2TN2,
    group_name: "2TN2",
    subject_id: ids.physics,
    subject_name: "Physics",
    teacher_id: ids.teacherKalandarova,
    teacher_name: "Kalandarova Gavxar",
    value: 4,
    comment: "Oral answer",
    author_id: ids.teacherKalandarova,
    created_at: FIXTURE_NOW,
    updated_at: FIXTURE_NOW,
  },
]
