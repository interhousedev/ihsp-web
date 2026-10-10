import type { MyTeacher, TeacherLesson, TeacherSlot } from "@ihsp/api"
import {
  FIXTURE_NOW,
  FIXTURE_TODAY,
  FIXTURE_WEEK_START,
  atTashkent,
  audienceGroup,
  bellOf,
  roomRefs,
  subjectRefs,
  teacherOf,
  weekPattern,
  type RoomKey,
  type SubjectKey,
} from "./world"

/** Lessons of the teacher's other groups (not the student's): muted in the teacher timetable. */
const OTHER_GROUPS: { group: string; weekday: number; period: number; room: RoomKey }[] = [
  { group: "1TN1", weekday: 2, period: 4, room: "r101" },
  { group: "3TN2", weekday: 5, period: 2, room: "r204" },
  { group: "1TN1", weekday: 4, period: 5, room: "r102" },
]

/** `date|period` of the lessons that are cancelled (the fixture Wednesday's third period is). */
const CANCELLED = new Set(["2026-10-07|3"])

const DAY_MS = 24 * 60 * 60 * 1000

/** ISO weekday of a `YYYY-MM-DD` date: 1 Monday .. 7 Sunday. */
export function isoWeekday(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return day === 0 ? 7 : day
}

/** `YYYY-MM-DD` shifted by `days`. */
export function addDaysIso(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

/** Every date from `from` to `to`, both inclusive (at most 62 days). */
function datesBetween(from: string, to: string): string[] {
  const dates: string[] = []
  for (let date = from; date <= to && dates.length < 62; date = addDaysIso(date, 1)) dates.push(date)
  return dates
}

function subjectKeyOf(teacherId: string): SubjectKey | undefined {
  return (Object.keys(teacherOf) as SubjectKey[]).find((key) => teacherOf[key].id === teacherId)
}

/**
 * The teacher's lessons in every group from `from` to `to` (inclusive), Monday to Friday only. The student's group is
 * `audienceGroup` (`mine` true); the other groups carry their own labels. Empty for an unknown teacher.
 */
export function teacherTimetable(teacherId: string, from: string, to: string): TeacherSlot[] {
  const key = subjectKeyOf(teacherId)
  if (!key) return []
  const subject = subjectRefs[key]
  const slots: TeacherSlot[] = []
  for (const date of datesBetween(from, to)) {
    const weekday = isoWeekday(date)
    if (weekday > 5) continue
    const own = weekPattern.filter((slot) => slot.subject === key && slot.weekday === weekday)
    const others = OTHER_GROUPS.filter((slot) => slot.weekday === weekday)
    const lessons = [
      ...own.map((slot) => ({ period: slot.period, room: slot.room, group: audienceGroup.group_name, mine: true })),
      ...others.map((slot) => ({ period: slot.period, room: slot.room, group: slot.group, mine: false })),
    ]
    for (const lesson of lessons) {
      const bell = bellOf(lesson.period)
      slots.push({
        id: `slot-${date}-${lesson.period}-${lesson.group}`,
        date,
        starts_at: atTashkent(date, bell.start),
        ends_at: atTashkent(date, bell.end),
        subject_id: subject.id,
        subject_name: subject.name,
        room: roomRefs[lesson.room].name,
        group: lesson.group,
        mine: lesson.mine,
        lesson_id: lesson.mine ? `lesson-${date}-${lesson.period}` : null,
        status: CANCELLED.has(`${date}|${lesson.period}`) ? "cancelled" : "scheduled",
      })
    }
  }
  return slots.toSorted(
    (a, b) => a.starts_at.localeCompare(b.starts_at) || (a.group ?? "").localeCompare(b.group ?? ""),
  )
}

/** A teacher's lesson with the student's groups, the shape of the student's teacher list. */
function studentLesson(slot: TeacherSlot): TeacherLesson {
  return {
    date: slot.date,
    weekday: isoWeekday(slot.date),
    starts_at: slot.starts_at,
    ends_at: slot.ends_at,
    subject_id: slot.subject_id,
    subject: slot.subject_name,
    group: slot.group,
    room: slot.room,
    lesson_id: slot.lesson_id,
  }
}

/** The student's own-group lessons of one teacher that are not cancelled, by time. */
function studentLessons(teacherId: string, from: string, to: string): TeacherLesson[] {
  return teacherTimetable(teacherId, from, to)
    .filter((slot) => slot.mine && slot.status !== "cancelled")
    .map(studentLesson)
}

const WEEK_END = addDaysIso(FIXTURE_WEEK_START, 6)
const TWO_WEEKS_END = addDaysIso(FIXTURE_TODAY, 14)

/**
 * The teacher who teaches the fixture student physics (Kalandarova Gavxar): contacts, the week and the next 14 days of
 * lessons with the student's group. `teaching_now` is false at the fixture time, and `next` is the Wednesday lesson.
 */
export function myTeacherOf(teacherId: string): MyTeacher | undefined {
  const key = subjectKeyOf(teacherId)
  if (!key) return undefined
  const teacher = teacherOf[key]
  const subject = subjectRefs[key]
  const week = studentLessons(teacherId, FIXTURE_WEEK_START, WEEK_END)
  const upcoming = studentLessons(teacherId, FIXTURE_TODAY, TWO_WEEKS_END)
  const next = upcoming.find((lesson) => Date.parse(lesson.starts_at) > Date.parse(FIXTURE_NOW)) ?? null
  return {
    id: teacher.id,
    first_name: teacher.first_name,
    last_name: teacher.last_name,
    middle_name: null,
    photo_url: null,
    subjects: [subject.name],
    subject_refs: [{ id: subject.id, name: subject.name }],
    contacts: {
      telegram: "gavxar_k",
      email: "kalandarova@example.org",
      phone: "+998 90 123-45-67",
      office_hours: "Mon 15:00",
      office: "305",
      note: null,
    },
    teaching_now: false,
    current: null,
    next,
    week,
    upcoming,
  }
}
