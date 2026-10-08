import type { Journal } from "@ihsp/api"

export type ToggleChange = { lessonId: string; studentId: string; absent: boolean }

/**
 * The journal after one cell was toggled (saved at once, UF-STF-07): the cell, the student's absence count and the
 * column ("attendance taken") change; an absence that is removed loses its excuse.
 */
export function applyToggle(journal: Journal, change: ToggleChange): Journal {
  return {
    ...journal,
    lessons: journal.lessons.map((lesson) =>
      lesson.id === change.lessonId ? { ...lesson, attendance_submitted: true } : lesson,
    ),
    students: journal.students.map((student) => {
      if (student.user_id !== change.studentId) return student
      let delta = 0
      const cells = student.cells.map((cell) => {
        if (cell.lesson_id !== change.lessonId || cell.absent === change.absent) return cell
        delta = change.absent ? 1 : -1
        return { ...cell, absent: change.absent, excused: change.absent ? cell.excused : false }
      })
      return { ...student, cells, absences: Math.max(0, student.absences + delta) }
    }),
  }
}

/** Stores the version the server returned for a lesson, so the next toggle of that column is checked against it. */
export function withLessonVersion(journal: Journal, lessonId: string, version: number): Journal {
  return {
    ...journal,
    lessons: journal.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, version } : lesson)),
  }
}
