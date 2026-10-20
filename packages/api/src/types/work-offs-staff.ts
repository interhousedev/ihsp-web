// Academic — work-off tasks of the teacher: reusable templates and the work-offs attached to a lesson's absences.

/** `PATCH` can reopen a done work-off. */
export type WorkOffItemStatus = "assigned" | "done"

/** A teacher's reusable work-off text (the "default work-off task" when `is_default`). */
export type WorkOffTemplate = {
  id: string
  text: string
  is_default: boolean
  created_at: string
  updated_at: string
}
export type WorkOffTemplateBody = { text: string; is_default?: boolean }

/** A work-off given to one absent student of a lesson (`AttendanceSheet.work_offs`). */
export type WorkOffItem = {
  id: string
  lesson_id: string
  student_id: string
  template_id: string | null
  text: string
  status: WorkOffItemStatus
  due_date: string | null
  done_at: string | null
  assigned_by: string
  created_at: string
  updated_at: string
}
export type WorkOffPatchBody = { text?: string; due_date?: string | null; status?: WorkOffItemStatus }

/** How a save treats the work-offs: per student (default), none, or one common task for every absent student. */
export type WorkOffMode = "per_student" | "none" | "common"

/** A work-off choice for one absent student; neither a template nor a text removes the student's work-off. */
export type WorkOffChoice = {
  student_id: string
  template_id?: string | null
  text?: string | null
  due_date?: string | null
}
export type CommonWorkOffChoice = { template_id?: string | null; text?: string | null; due_date?: string | null }
