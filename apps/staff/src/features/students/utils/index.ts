import type { Journal, JournalOption } from "@ihsp/api"
import { fullName } from "../../shared/utils/people"

type JournalStudent = Journal["students"][number]
type JournalLesson = Journal["lessons"][number]

/** One journal (a subject and an audience of the teacher) in which the student appears. */
export type StudentEntry = { option: JournalOption; journal: Journal; student: JournalStudent }

/** A student of the teacher, merged from all the journals the teacher teaches. */
export type StudentSummary = {
  userId: string
  firstName: string
  lastName: string
  entries: StudentEntry[]
}

export type TeacherJournal = { option: JournalOption; journal: Journal }

/** Students of every journal of the teacher, one summary per student, sorted by name. */
export function buildStudentIndex(journals: readonly TeacherJournal[]): StudentSummary[] {
  const byId = new Map<string, StudentSummary>()
  for (const { option, journal } of journals) {
    for (const student of journal.students) {
      const summary = byId.get(student.user_id) ?? {
        userId: student.user_id,
        firstName: student.first_name,
        lastName: student.last_name,
        entries: [],
      }
      summary.entries.push({ option, journal, student })
      byId.set(student.user_id, summary)
    }
  }
  return [...byId.values()].sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
}

export function nameOf(summary: Pick<StudentSummary, "firstName" | "lastName">): string {
  return fullName({ first_name: summary.firstName, last_name: summary.lastName })
}

/** Every word of the query must start a word of the name, in either order ("mad naz" finds "Nazarova Madina"). */
export function searchStudents(index: readonly StudentSummary[], query: string): StudentSummary[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return [...index]
  return index.filter((student) => {
    const parts = nameOf(student).toLowerCase().split(/\s+/)
    return words.every((word) => parts.some((part) => part.startsWith(word)))
  })
}

export type StudentLesson = {
  lessonId: string
  date: string
  topic: string | null
  subjectName: string
  absent: boolean
  excused: boolean
  marks: number[]
}

/** The student's lessons that have already taken place, newest first (`today` is an ISO date). */
export function recentLessons(summary: StudentSummary, today: string, limit: number): StudentLesson[] {
  const lessons: StudentLesson[] = []
  for (const { journal, student } of summary.entries) {
    for (const lesson of journal.lessons as JournalLesson[]) {
      if (lesson.date > today) continue
      const cell = student.cells.find((item) => item.lesson_id === lesson.id)
      if (!cell) continue
      lessons.push({
        lessonId: lesson.id,
        date: lesson.date,
        topic: lesson.topic,
        subjectName: journal.subject.name,
        absent: cell.absent,
        excused: cell.excused,
        marks: cell.marks,
      })
    }
  }
  return lessons.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}

/** Absences and the lessons whose attendance was taken, over all subjects of the student. */
export function attendanceOf(summary: StudentSummary): { absences: number; lessons: number } {
  let absences = 0
  let lessons = 0
  for (const { journal, student } of summary.entries) {
    absences += student.absences
    lessons += journal.lessons.filter((lesson) => lesson.attendance_submitted).length
  }
  return { absences, lessons }
}

/** The marks of one subject with their dates, oldest first. */
export function marksOf(entry: StudentEntry): { date: string; mark: number }[] {
  const dates = new Map(entry.journal.lessons.map((lesson) => [lesson.id, lesson.date]))
  return entry.student.cells
    .flatMap((cell) => cell.marks.map((mark) => ({ date: dates.get(cell.lesson_id) ?? "", mark })))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Subjects of a student, then the distinct audiences, shown under the name: "Physics, Chemistry · 2TN2". */
export function subjectsLine(summary: StudentSummary): string {
  const subjects = [...new Set(summary.entries.map((entry) => entry.option.subject.name))]
  const groups = [...new Set(summary.entries.map((entry) => entry.option.label))]
  return `${subjects.join(", ")} · ${groups.join(", ")}`
}
