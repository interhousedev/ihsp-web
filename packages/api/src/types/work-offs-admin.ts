// Admin statistics of work-off tasks (`/v1/admin/work-offs`, `/v1/admin/work-offs/stats`).

export type WorkOffGroupBy = "subject" | "teacher" | "group" | "student"

export type WorkOffStatsParams = { from?: string; to?: string; group_by?: WorkOffGroupBy }

export type WorkOffStatsRow = { key: string; name: string; open_count: number; done_count: number }

export type WorkOffStats = {
  group_by: WorkOffGroupBy
  from: string
  to: string
  total_open: number
  rows: WorkOffStatsRow[]
}

export type AdminWorkOffStatus = "open" | "done" | "all"

export type AdminWorkOffsParams = {
  from?: string
  to?: string
  subject_id?: string
  teacher_id?: string
  group_id?: string
  student_id?: string
  status?: AdminWorkOffStatus
  limit?: number
  offset?: number
}

export type AdminWorkOffItem = {
  id: string
  lesson_id: string
  date: string
  period: number
  subject_name: string
  teacher_name: string | null
  group_name: string | null
  student_id: string
  student_name: string
  text: string
  status: "assigned" | "done"
  due_date: string | null
  done_at: string | null
  created_at: string
}

export type AdminWorkOffList = { total: number; items: AdminWorkOffItem[] }
