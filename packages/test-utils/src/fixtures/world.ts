// The demo world shared by every fixture file. It mirrors the backend seed (`python -m app seed-demo`):
// group 2TN2, student Brastilov Aleksey, teacher Kalandarova Gavxar, rooms 101/102/204/Klaster,
// term 2026-2027 half 1, six bells. "Today" is Wednesday 2026-10-07 and "now" is 10:12 in Tashkent, between the second and third lessons.

import type { AudienceItem, Bell, LessonItem, PersonRef, RoomRefLite, SubjectRef } from "@ihsp/api"

export const FIXTURE_TODAY = "2026-10-07"
export const FIXTURE_TOMORROW = "2026-10-08"
/** 10:12 in Asia/Tashkent (UTC+5). */
export const FIXTURE_NOW = "2026-10-07T05:12:00Z"
export const FIXTURE_WEEK_START = "2026-10-05"

/** Deterministic UUID: `kind` groups entities (users, groups, ...), `n` numbers them. */
export function uuid(kind: number, n: number): string {
  return `${kind.toString(16).padStart(8, "0")}-0000-4000-8000-${n.toString(16).padStart(12, "0")}`
}

export const ids = {
  student: uuid(1, 1),
  student2: uuid(1, 2),
  student3: uuid(1, 3),
  student4: uuid(1, 4),
  teacherRakhimov: uuid(1, 11),
  teacherSmirnova: uuid(1, 12),
  teacherKalandarova: uuid(1, 13),
  teacherYusupov: uuid(1, 14),
  teacherKarimova: uuid(1, 15),
  teacherTursunov: uuid(1, 16),
  admin: uuid(1, 21),
  group2TN2: uuid(2, 1),
  group1TN1: uuid(2, 2),
  math: uuid(3, 1),
  physics: uuid(3, 2),
  english: uuid(3, 3),
  informatics: uuid(3, 4),
  chemistry: uuid(3, 5),
  history: uuid(3, 6),
  room101: uuid(4, 1),
  room102: uuid(4, 2),
  room204: uuid(4, 3),
  roomKlaster: uuid(4, 4),
  term: uuid(6, 1),
  termPrevious: uuid(6, 2),
  lessonPhysicsToday: uuid(5, 33),
  lessonMathToday: uuid(5, 31),
  file: uuid(8, 1),
  fileImage: uuid(8, 2),
  fileRejected: uuid(8, 3),
  link: uuid(9, 1),
  linkChat: uuid(9, 2),
  chat: uuid(10, 1),
  chat2: uuid(10, 2),
  toolCallPending: uuid(11, 1),
  flashcardSet: uuid(12, 1),
  broadcast: uuid(13, 1),
  course: uuid(14, 1),
  courseStepText: uuid(15, 1),
  courseStepTest: uuid(15, 2),
  courseStepCards: uuid(15, 3),
  courseSectionIntro: uuid(16, 1),
  courseSectionRules: uuid(16, 2),
  attempt: uuid(17, 1),
} as const

// --- People ---

export const persons = {
  student: { id: ids.student, first_name: "Aleksey", last_name: "Brastilov" },
  rakhimov: { id: ids.teacherRakhimov, first_name: "Timur", last_name: "Rakhimov" },
  smirnova: { id: ids.teacherSmirnova, first_name: "Elena", last_name: "Smirnova" },
  kalandarova: { id: ids.teacherKalandarova, first_name: "Gavxar", last_name: "Kalandarova" },
  yusupov: { id: ids.teacherYusupov, first_name: "Farrukh", last_name: "Yusupov" },
  karimova: { id: ids.teacherKarimova, first_name: "Dilnoza", last_name: "Karimova" },
  tursunov: { id: ids.teacherTursunov, first_name: "Bobur", last_name: "Tursunov" },
  admin: { id: ids.admin, first_name: "Admin", last_name: "Ihsp" },
} satisfies Record<string, PersonRef>

// --- Subjects and rooms ---

export const subjectRefs = {
  math: { id: ids.math, name: "Mathematics", short_name: "Math" },
  physics: { id: ids.physics, name: "Physics", short_name: "Phys" },
  english: { id: ids.english, name: "English", short_name: "Eng" },
  informatics: { id: ids.informatics, name: "Informatics", short_name: "IT" },
  chemistry: { id: ids.chemistry, name: "Chemistry", short_name: "Chem" },
  history: { id: ids.history, name: "History", short_name: "Hist" },
} satisfies Record<string, SubjectRef>

export type SubjectKey = keyof typeof subjectRefs

export const roomRefs = {
  r101: { id: ids.room101, slug: "101", name: "101" },
  r102: { id: ids.room102, slug: "102", name: "102" },
  r204: { id: ids.room204, slug: "204", name: "204" },
  klaster: { id: ids.roomKlaster, slug: "klaster", name: "Klaster" },
} satisfies Record<string, RoomRefLite>

export type RoomKey = keyof typeof roomRefs

export const teacherOf: Record<SubjectKey, PersonRef> = {
  math: persons.rakhimov,
  physics: persons.kalandarova,
  english: persons.smirnova,
  informatics: persons.yusupov,
  chemistry: persons.karimova,
  history: persons.tursunov,
}

// --- Time ---

export const bells: Bell[] = [
  { period: 1, start: "08:30", end: "09:15", weekdays: [1, 2, 3, 4, 5], source: "manual" },
  { period: 2, start: "09:25", end: "10:10", weekdays: [1, 2, 3, 4, 5], source: "manual" },
  { period: 3, start: "10:20", end: "11:05", weekdays: [1, 2, 3, 4, 5], source: "manual" },
  { period: 4, start: "11:25", end: "12:10", weekdays: [1, 2, 3, 4, 5], source: "manual" },
  { period: 5, start: "12:20", end: "13:05", weekdays: [1, 2, 3, 4, 5], source: "manual" },
  { period: 6, start: "13:15", end: "14:00", weekdays: [1, 2, 3, 4, 5], source: "manual" },
]

/** The same six periods as the EMIS `class-hours` sync stores them: read-only for Administration. */
export const emisBells: Bell[] = bells.map((bell) => ({ ...bell, source: "emis" }))

/** `YYYY-MM-DD` + `HH:MM` in Asia/Tashkent (UTC+5) as an ISO 8601 UTC string. */
export function atTashkent(date: string, time: string): string {
  const year = Number(date.slice(0, 4))
  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))
  const hours = Number(time.slice(0, 2))
  const minutes = Number(time.slice(3, 5))
  return new Date(Date.UTC(year, month - 1, day, hours - 5, minutes)).toISOString().replace(".000Z", "Z")
}

/** Dates of the fixture week, Monday 5 October to Friday 9 October 2026, keyed by ISO weekday. */
export const weekDates: Record<number, string> = {
  1: "2026-10-05",
  2: "2026-10-06",
  3: "2026-10-07",
  4: "2026-10-08",
  5: "2026-10-09",
}

// --- Audience ---

export const audienceGroup: AudienceItem = { group_id: ids.group2TN2, group_name: "2TN2", subgroup: null }
export const audienceSubgroup1: AudienceItem = { group_id: ids.group2TN2, group_name: "2TN2", subgroup: 1 }
export const audienceSubgroup2: AudienceItem = { group_id: ids.group2TN2, group_name: "2TN2", subgroup: 2 }

// --- Week pattern of group 2TN2 (the student is in subgroup 1) ---

export type Slot = {
  weekday: number
  period: number
  subject: SubjectKey
  room: RoomKey
  /** Subgroup of the lesson, or `null` for the whole group. */
  subgroup: 1 | 2 | null
}

export const weekPattern: Slot[] = [
  { weekday: 1, period: 1, subject: "math", room: "r101", subgroup: null },
  { weekday: 1, period: 2, subject: "physics", room: "r102", subgroup: null },
  { weekday: 1, period: 3, subject: "english", room: "r204", subgroup: 1 },
  { weekday: 1, period: 4, subject: "history", room: "r101", subgroup: null },
  { weekday: 2, period: 1, subject: "chemistry", room: "r204", subgroup: null },
  { weekday: 2, period: 2, subject: "math", room: "r101", subgroup: null },
  { weekday: 2, period: 3, subject: "informatics", room: "klaster", subgroup: 1 },
  { weekday: 2, period: 4, subject: "english", room: "r204", subgroup: 1 },
  { weekday: 3, period: 1, subject: "math", room: "r101", subgroup: null },
  { weekday: 3, period: 2, subject: "english", room: "r204", subgroup: 1 },
  { weekday: 3, period: 3, subject: "physics", room: "r102", subgroup: null },
  { weekday: 3, period: 4, subject: "informatics", room: "klaster", subgroup: 1 },
  { weekday: 3, period: 5, subject: "chemistry", room: "r204", subgroup: null },
  { weekday: 3, period: 6, subject: "history", room: "r101", subgroup: null },
  { weekday: 4, period: 1, subject: "physics", room: "r102", subgroup: null },
  { weekday: 4, period: 2, subject: "math", room: "r101", subgroup: null },
  { weekday: 4, period: 3, subject: "chemistry", room: "r204", subgroup: null },
  { weekday: 5, period: 1, subject: "english", room: "r204", subgroup: 1 },
  { weekday: 5, period: 2, subject: "informatics", room: "klaster", subgroup: 1 },
  { weekday: 5, period: 3, subject: "history", room: "r101", subgroup: null },
  { weekday: 5, period: 4, subject: "physics", room: "r102", subgroup: null },
]

export function audienceOf(subgroup: 1 | 2 | null): AudienceItem {
  if (subgroup === 1) return audienceSubgroup1
  if (subgroup === 2) return audienceSubgroup2
  return audienceGroup
}

/** Lesson id: `5` + weekday and period, e.g. Wednesday period 3 is `lessonId(3, 3)`. */
export function lessonId(weekday: number, period: number): string {
  return uuid(5, weekday * 10 + period)
}

export function bellOf(period: number): Bell {
  const bell = bells.find((item) => item.period === period)
  if (!bell) throw new Error(`No bell for period ${period}`)
  return bell
}

export type LessonOverrides = Partial<LessonItem>

export function makeLesson(slot: Slot, overrides: LessonOverrides = {}): LessonItem {
  const date = weekDates[slot.weekday] ?? FIXTURE_TODAY
  const bell = bellOf(slot.period)
  return {
    id: lessonId(slot.weekday, slot.period),
    date,
    period: slot.period,
    starts_at: atTashkent(date, bell.start),
    ends_at: atTashkent(date, bell.end),
    subject: subjectRefs[slot.subject],
    teacher: teacherOf[slot.subject],
    room: roomRefs[slot.room],
    audience: [audienceOf(slot.subgroup)],
    status: "scheduled",
    is_overridden: false,
    changes: null,
    topic: null,
    kind: "other",
    topic_source: null,
    has_homework: false,
    attendance_submitted: false,
    ...overrides,
  }
}

/** All lessons of the fixture week (Mon 5 Oct to Fri 9 Oct); topics and homework flags set for the past ones. */
export const weekLessons: LessonItem[] = weekPattern.map((slot) => {
  const past = slot.weekday < 3 || (slot.weekday === 3 && slot.period <= 2)
  const homework = slot.weekday === 3 && slot.subject === "physics"
  return makeLesson(slot, {
    topic: past ? `${subjectRefs[slot.subject].name}: topic of ${weekDates[slot.weekday] ?? ""}` : null,
    topic_source: past ? "manual" : null,
    attendance_submitted: past,
    has_homework: past || homework,
  })
})

/** The six lessons of today (Wednesday) in period order. */
export const todayLessons: LessonItem[] = weekLessons.filter((lesson) => lesson.date === FIXTURE_TODAY)

export function findLesson(id: string): LessonItem | undefined {
  return weekLessons.find((lesson) => lesson.id === id)
}
