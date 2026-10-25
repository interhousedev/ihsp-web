import type {
  DayGrades,
  MarkItem,
  PersonRef,
  RecordBook,
  SemesterGrades,
  SubjectCard,
  SubjectDetail,
  SubjectTeacher,
  SyncRunItem,
} from "@ihsp/api"
import { resourceItems } from "./links"
import { ids, lessonId, persons, subjectRefs, teacherOf, weekLessons } from "./world"
import type { SubjectKey } from "./world"

const SEMESTER = 4

function mark(
  subject: SubjectKey,
  type: MarkItem["type"],
  value: number,
  date: string,
  lesson: string | null = null,
): MarkItem {
  return { subject: subjectRefs[subject], semester: SEMESTER, type, value, date, lesson_id: lesson }
}

/** Marks 2–5 of the demo student in semester 4. The ones of 2026-10-06 are "new" since the last visit. */
export const marks: MarkItem[] = [
  mark("math", "lesson", 5, "2026-09-16"),
  mark("math", "lesson", 4, "2026-09-23"),
  mark("math", "midterm", 4, "2026-10-02"),
  mark("math", "lesson", 5, "2026-10-06", lessonId(2, 2)),
  mark("physics", "lesson", 4, "2026-09-18"),
  mark("physics", "lesson", 5, "2026-09-30"),
  mark("physics", "midterm", 5, "2026-10-02"),
  mark("english", "lesson", 3, "2026-09-17"),
  mark("english", "lesson", 4, "2026-10-06", lessonId(2, 4)),
  mark("chemistry", "lesson", 2, "2026-09-22"),
  mark("chemistry", "midterm", 3, "2026-10-02"),
  mark("chemistry", "lesson", 3, "2026-10-06", lessonId(2, 1)),
  mark("history", "lesson", 5, "2026-09-24"),
  mark("history", "lesson", 4, "2026-10-06"),
  mark("informatics", "lesson", 5, "2026-09-29"),
]

export const newMarks: MarkItem[] = marks.filter((item) => item.date === "2026-10-06")

/** A subject teacher of the marks views: the person with no photo (`photo_url` is null). */
const subjectTeacher = (person: PersonRef): SubjectTeacher => ({ ...person, photo_url: null })

export const subjectCards: SubjectCard[] = (Object.keys(subjectRefs) as SubjectKey[]).map((key) => ({
  subject: subjectRefs[key],
  teachers: [subjectTeacher(teacherOf[key])],
  semester_mark: {
    math: 4.6,
    physics: 4.8,
    english: 3.6,
    informatics: 5,
    chemistry: 2.7,
    history: 5,
  }[key],
  emis_rating: { math: 5, physics: 5, english: 4, informatics: 5, chemistry: 3, history: 5 }[key],
  absences: { math: 2, physics: 0, english: 1, informatics: 0, chemistry: 1, history: 1 }[key],
  next_lesson:
    weekLessons.find((lesson) => lesson.subject.id === subjectRefs[key].id && lesson.date >= "2026-10-07") ?? null,
}))

export const semesterGrades: SemesterGrades = {
  semester: SEMESTER,
  gpa: 4.1,
  synced_at: "2026-10-07T01:00:00Z",
  rows: [
    {
      subject: subjectRefs.math,
      lesson_avg: 4.67,
      midterm_avg: 4,
      final_avg: null,
      semester_mark: 4.6,
      emis_rating: 5,
      marks_count: 4,
    },
    {
      subject: subjectRefs.physics,
      lesson_avg: 4.5,
      midterm_avg: 5,
      final_avg: null,
      semester_mark: 4.8,
      gpa_with_temporary: 4.3,
      emis_rating: 5,
      marks_count: 3,
    },
    {
      subject: subjectRefs.english,
      lesson_avg: 3.5,
      midterm_avg: null,
      final_avg: null,
      semester_mark: 3.6,
      emis_rating: 4,
      marks_count: 2,
    },
    {
      subject: subjectRefs.informatics,
      lesson_avg: 5,
      midterm_avg: null,
      final_avg: null,
      semester_mark: 5,
      emis_rating: 5,
      marks_count: 1,
    },
    {
      subject: subjectRefs.chemistry,
      lesson_avg: 2.5,
      midterm_avg: 3,
      final_avg: null,
      semester_mark: 2.7,
      emis_rating: 3,
      marks_count: 3,
    },
    {
      subject: subjectRefs.history,
      lesson_avg: 5,
      midterm_avg: null,
      final_avg: null,
      semester_mark: 5,
      emis_rating: 5,
      marks_count: 1,
    },
  ],
}

/** Marks of 2026-10-06 matched to lessons, plus one midterm mark EMIS reported without a lesson. */
export const dayGrades: DayGrades = {
  date: "2026-10-06",
  lessons: weekLessons
    .filter((lesson) => newMarks.some((item) => item.lesson_id === lesson.id))
    .map((lesson) => ({ lesson, marks: newMarks.filter((item) => item.lesson_id === lesson.id) })),
  unmatched: newMarks.filter((item) => item.lesson_id === null),
}

export const recordBook: RecordBook = {
  semesters: [
    {
      semester: 1,
      gpa: 3.9,
      subjects: [
        { subject: subjectRefs.math, semester_mark: 4, emis_rating: 4 },
        { subject: subjectRefs.physics, semester_mark: 4, emis_rating: 4 },
        { subject: subjectRefs.english, semester_mark: 3, emis_rating: 4 },
      ],
    },
    {
      semester: 2,
      gpa: 4.0,
      subjects: [
        { subject: subjectRefs.math, semester_mark: 4, emis_rating: 4 },
        { subject: subjectRefs.physics, semester_mark: 5, emis_rating: 5 },
        { subject: subjectRefs.history, semester_mark: 4, emis_rating: 4 },
      ],
    },
    {
      semester: 3,
      gpa: 3.9,
      subjects: [
        { subject: subjectRefs.math, semester_mark: 4, emis_rating: 5 },
        { subject: subjectRefs.chemistry, semester_mark: 3, emis_rating: 3 },
        { subject: subjectRefs.informatics, semester_mark: 5, emis_rating: 5 },
      ],
    },
    {
      semester: 4,
      gpa: 4.1,
      subjects: semesterGrades.rows.map((row) => ({
        subject: row.subject,
        semester_mark: row.semester_mark,
        emis_rating: row.emis_rating,
      })),
    },
  ],
}

/** Physics detail for semester 4: lessons of the fixture week with marks, attendance and homework. */
export const subjectDetailPhysics: SubjectDetail = {
  subject: subjectRefs.physics,
  semester: SEMESTER,
  teachers: [subjectTeacher(persons.kalandarova)],
  averages: { lesson: 4.5, midterm: 5, final: null },
  semester_mark: 4.8,
  gpa_with_temporary: 4.3,
  emis_rating: 5,
  absence_rate: 0,
  lessons: weekLessons
    .filter((lesson) => lesson.subject.id === ids.physics)
    .map((lesson) => ({
      ...lesson,
      marks: marks.filter((item) => item.lesson_id === lesson.id),
      attendance: lesson.date < "2026-10-07" ? ("present" as const) : ("not_taken" as const),
      homework_text: lesson.id === ids.lessonPhysicsToday ? "Solve problems 14-17 on page 52" : null,
    })),
  marks: marks.filter((item) => item.subject.id === ids.physics),
  materials: resourceItems.filter((item) => item.role === "material"),
}

export const syncRuns: SyncRunItem[] = [
  {
    id: "00000013-0000-4000-8000-000000000001",
    started_at: "2026-10-07T01:00:00Z",
    finished_at: "2026-10-07T01:04:10Z",
    status: "success",
    stats: { students: 42, marks_added: 17, failed: 0 },
  },
  {
    id: "00000013-0000-4000-8000-000000000002",
    started_at: "2026-10-06T01:00:00Z",
    finished_at: "2026-10-06T01:05:30Z",
    status: "partial",
    stats: { students: 42, marks_added: 9, failed: 2 },
  },
]

/** Looks up a subject card by id; used by handlers. */
export function findSubjectCard(subjectId: string): SubjectCard | undefined {
  return subjectCards.find((card) => card.subject.id === subjectId)
}
