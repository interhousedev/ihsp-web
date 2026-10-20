// Academic — the student's work-off tasks (backend spec: `GET /v1/me/work-offs`, WO-6).

export type WorkOffStatus = "assigned" | "done"

/** One work-off task given to the student for a missed lesson. */
export type MyWorkOff = {
  id: string
  lesson_id: string
  date: string
  period: number
  subject_name: string
  teacher_name: string | null
  text: string
  status: WorkOffStatus
  due_date: string | null
  done_at: string | null
  created_at: string
}

export type MyWorkOffsParams = { status?: "open" | "all" }
