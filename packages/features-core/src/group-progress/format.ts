import type { GroupProgressCell, GroupProgressStudent } from "@ihsp/api"

/** A mark or average with one decimal at most; "–" when there is none. */
export function formatMark(value: number | null): string {
  if (value === null) return "–"
  return String(Math.round(value * 10) / 10)
}

/** A 0..1 fraction as a whole percent; "–" when there is none. */
export function formatPercent(rate: number | null): string {
  return rate === null ? "–" : `${Math.round(rate * 100)}%`
}

export function cellOf(student: GroupProgressStudent, subjectId: string): GroupProgressCell | undefined {
  return student.cells.find((cell) => cell.subject_id === subjectId)
}

export function hasNoMarks(cell: GroupProgressCell | undefined): boolean {
  return (
    cell === undefined ||
    (cell.semester_mark === null && cell.midterm_avg === null && cell.final_avg === null && cell.lesson_avg === null)
  )
}
