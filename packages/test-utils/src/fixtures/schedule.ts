import type {
  Conflict,
  GroupDetail,
  GroupItem,
  GroupStudent,
  ImportConfirmResult,
  ImportPreview,
  LessonItem,
  Room,
  StudentItem,
  StudentProfile,
  Subject,
  Term,
  TimetableEntry,
} from "@ihsp/api"
import {
  audienceOf,
  bells,
  emisBells,
  ids,
  makeLesson,
  persons,
  roomRefs,
  subjectRefs,
  teacherOf,
  uuid,
  weekLessons,
  weekPattern,
} from "./world"
import { controlPeriods } from "./assessments"

export const currentTerm: Term = {
  id: ids.term,
  academic_year: "2026-2027",
  half: 1,
  starts_on: "2026-09-02",
  ends_on: "2026-12-30",
  bells,
  non_study_days: ["2026-10-01"],
  moved_days: [{ date: "2026-10-31", follows_weekday: 1 }],
  control_periods: controlPeriods,
  is_current: true,
}

/** A term whose lesson times were synced from EMIS class hours: its bells are read-only. */
export const previousTerm: Term = {
  id: ids.termPrevious,
  academic_year: "2025-2026",
  half: 2,
  starts_on: "2026-02-02",
  ends_on: "2026-06-26",
  bells: emisBells,
  non_study_days: [],
  moved_days: [],
  control_periods: {},
  is_current: false,
}

export const terms: Term[] = [currentTerm, previousTerm]

export const groupStudents: GroupStudent[] = [
  {
    user_id: ids.student,
    first_name: persons.student.first_name,
    last_name: persons.student.last_name,
    subgroup: 1,
    status: "active",
    registered: true,
  },
  {
    user_id: ids.student2,
    first_name: "Jasur",
    last_name: "Ismoilov",
    subgroup: 2,
    status: "active",
    registered: true,
  },
  {
    user_id: ids.student3,
    first_name: "Madina",
    last_name: "Nazarova",
    subgroup: 1,
    status: "active",
    registered: true,
  },
  {
    user_id: ids.student4,
    first_name: "Sardor",
    last_name: "Qodirov",
    subgroup: null,
    status: "active",
    registered: false,
  },
]

export const group2TN2: GroupItem = {
  id: ids.group2TN2,
  name: "2TN2",
  slug: "2tn2",
  current_semester: 4,
  status: "active",
  students_count: 4,
  subgroups_assigned: 3,
  unregistered_count: 1,
  curator: persons.kalandarova,
  head_student: persons.student,
}

export const group1TN1: GroupItem = {
  id: ids.group1TN1,
  name: "1TN1",
  slug: "1tn1",
  current_semester: 1,
  status: "active",
  students_count: 0,
  subgroups_assigned: 0,
  unregistered_count: 0,
  curator: null,
  head_student: null,
}

export const groups: GroupItem[] = [group2TN2, group1TN1]

export const groupDetail2TN2: GroupDetail = { ...group2TN2, emis_group_id: 3292, students: groupStudents }
export const groupDetail1TN1: GroupDetail = { ...group1TN1, emis_group_id: 3291, students: [] }

export const subjects: Subject[] = [
  {
    id: ids.math,
    name: { uz: "Matematika", ru: "Математика", en: "Mathematics" },
    short_name: "Math",
    emis_subject_id: 101,
    can_be_divided: false,
  },
  {
    id: ids.physics,
    name: { uz: "Fizika", ru: "Физика", en: "Physics" },
    short_name: "Phys",
    emis_subject_id: 102,
    can_be_divided: false,
  },
  {
    id: ids.english,
    name: { uz: "Ingliz tili", ru: "Английский язык", en: "English" },
    short_name: "Eng",
    emis_subject_id: 103,
    can_be_divided: true,
  },
  {
    id: ids.informatics,
    name: { uz: "Informatika", ru: "Информатика", en: "Informatics" },
    short_name: "IT",
    emis_subject_id: 104,
    can_be_divided: true,
  },
  {
    id: ids.chemistry,
    name: { uz: "Kimyo", ru: "Химия", en: "Chemistry" },
    short_name: "Chem",
    emis_subject_id: 105,
    can_be_divided: false,
  },
  {
    id: ids.history,
    name: { uz: "Tarix", ru: "История", en: "History" },
    short_name: "Hist",
    emis_subject_id: 106,
    can_be_divided: false,
  },
]

export const rooms: Room[] = [
  {
    id: ids.room101,
    slug: "101",
    name: "101",
    pin: "4821",
    url: "http://localhost:8000/r/101?pin=4821",
    status: "active",
    lessons_this_week: 9,
  },
  {
    id: ids.room102,
    slug: "102",
    name: "102",
    pin: "7305",
    url: "http://localhost:8000/r/102?pin=7305",
    status: "active",
    lessons_this_week: 5,
  },
  {
    id: ids.room204,
    slug: "204",
    name: "204",
    pin: "1948",
    url: "http://localhost:8000/r/204?pin=1948",
    status: "active",
    lessons_this_week: 8,
  },
  {
    id: ids.roomKlaster,
    slug: "klaster",
    name: "Klaster",
    pin: "5560",
    url: "http://localhost:8000/r/klaster?pin=5560",
    status: "active",
    lessons_this_week: 4,
  },
]

/** The weekly timetable of group 2TN2 as admin timetable entries. */
export const timetableEntries: TimetableEntry[] = weekPattern.map((slot) => ({
  id: `00000007-0000-4000-8000-${(slot.weekday * 10 + slot.period).toString(16).padStart(12, "0")}`,
  term_id: ids.term,
  weekday: slot.weekday,
  period: slot.period,
  week_parity: "every",
  subject: subjectRefs[slot.subject],
  teacher: teacherOf[slot.subject],
  room: roomRefs[slot.room],
  audience: [audienceOf(slot.subgroup)],
  valid_from: "2026-09-02",
  valid_to: null,
  source: "manual",
}))

export const timetableConflicts: Conflict[] = [
  {
    kind: "teacher",
    with_entry_id: timetableEntries[0]?.id ?? null,
    with_lesson_id: null,
    description: "Rakhimov T. already teaches 2TN2 in period 1 on Monday",
    week_parity: "every",
  },
]

export const studentItems: StudentItem[] = groupStudents.map((student) => ({
  user_id: student.user_id,
  login: student.registered ? `${student.last_name}.${student.first_name}`.toLowerCase() : null,
  first_name: student.first_name,
  last_name: student.last_name,
  group: { id: ids.group2TN2, name: "2TN2" },
  subgroup: student.subgroup,
  status: student.status,
  emis_status: student.registered ? "active" : null,
  registered: student.registered,
  synced_at: student.registered ? "2026-10-07T01:00:00Z" : null,
}))

export const importPreview: ImportPreview = {
  import_id: "00000012-0000-4000-8000-000000000001",
  new: [
    {
      line: 2,
      last_name: "Aliyev",
      first_name: "Bekzod",
      middle_name: null,
      group_name: "2TN2",
      emis_student_id: 120101,
      note: null,
    },
    {
      line: 3,
      last_name: "Hasanova",
      first_name: "Zilola",
      middle_name: "Akmalovna",
      group_name: "2TN2",
      emis_student_id: 120102,
      note: null,
    },
  ],
  changed: [
    {
      line: 4,
      last_name: "Qodirov",
      first_name: "Sardor",
      middle_name: null,
      group_name: "2TN2",
      emis_student_id: 120044,
      note: "Group changed from 2TN1",
    },
  ],
  unchanged: 21,
  conflicts: [
    {
      line: 7,
      last_name: "Brastilov",
      first_name: "Aleksey",
      middle_name: null,
      group_name: "1TN1",
      emis_student_id: 120045,
      note: "Registered in 2TN2",
    },
  ],
}

export const importConfirmResult: ImportConfirmResult = { created: 2, updated: 1, skipped: 1 }

export const studentProfile: StudentProfile = {
  user_id: ids.student,
  login: "brastilov.aleksey",
  first_name: persons.student.first_name,
  last_name: persons.student.last_name,
  mailbox: "brastilov.aleksey@mail.ihsu.uz",
  group: { id: ids.group2TN2, name: "2TN2" },
  subgroup: 1,
  curator: persons.kalandarova,
  head_student: persons.student,
  current_semester: 4,
  emis_status: "active",
  synced_at: "2026-10-07T01:00:00Z",
}

/** A lesson nobody teaches yet (the teacher left): shown under "teacher needed". */
export const teacherNeededLesson: LessonItem = {
  ...makeLesson({ weekday: 5, period: 5, subject: "informatics", room: "klaster", subgroup: 2 }),
  id: uuid(5, 801),
  teacher: null,
}

/** A cancelled lesson with the recorded change. */
export const cancelledLesson: LessonItem = {
  ...makeLesson({ weekday: 4, period: 3, subject: "chemistry", room: "r204", subgroup: null }),
  status: "cancelled",
  is_overridden: true,
  changes: { status: ["scheduled", "cancelled"] },
}

/** Lessons of the fixture week as the admin lessons list shows them. */
export const adminLessons: LessonItem[] = [
  ...weekLessons.map((lesson) => (lesson.id === cancelledLesson.id ? cancelledLesson : lesson)),
  teacherNeededLesson,
]
