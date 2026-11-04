"use client"

import type { Journal, JournalParams } from "@ihsp/api"
import { useToggleAbsence } from "../journal/hooks/use-toggle-absence"
import { nextAttendanceState } from "./attendance-rules"

type Student = Journal["students"][number]
type Cell = Student["cells"][number]
type Lesson = Journal["lessons"][number]

/** The attendance state of the journal: the cycle of one cell (toggle mutation) and the excuse mutation lives in `useSetExcuse`. */
export function useAttendance(params: JournalParams) {
  const toggle = useToggleAbsence(params)

  function cycle(
    lesson: Lesson,
    student: Student,
    cell: Cell,
    callbacks: { onError: (error: unknown) => void; onSuccess: () => void },
  ) {
    if (!lesson.editable) return
    toggle.mutate({ lessonId: lesson.id, studentId: student.user_id, ...nextAttendanceState(cell) }, callbacks)
  }

  return { toggle, cycle }
}
