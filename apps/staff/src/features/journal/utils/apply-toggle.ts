import type { Journal } from "@ihsp/api"

export type ToggleChange = { lessonId: string; studentId: string; absent: boolean; late?: boolean }

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
      const late = change.late ?? false
      let absentDelta = 0
      let lateDelta = 0
      const cells = student.cells.map((cell) => {
        if (cell.lesson_id !== change.lessonId) return cell
        if (cell.absent === change.absent && (cell.late ?? false) === late) return cell
        if (cell.absent !== change.absent) absentDelta = change.absent ? 1 : -1
        if ((cell.late ?? false) !== late) lateDelta = late ? 1 : -1
        return { ...cell, absent: change.absent, late, excused: change.absent ? cell.excused : false }
      })
      return {
        ...student,
        cells,
        absences: Math.max(0, student.absences + absentDelta),
        lates: Math.max(0, (student.lates ?? 0) + lateDelta),
      }
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
