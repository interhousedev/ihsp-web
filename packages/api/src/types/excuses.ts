// Academic — excuses (official reasons for absences): the student's requests and the curators' decisions.

import type { Page, PageParams } from "./common"

export type ExcuseStatus = "pending" | "approved" | "rejected" | "cancelled"
export type ExcuseOrigin = "request" | "curator"

/** A ready reason of the request form; `title` has one text per locale. */
export type ExcuseTemplate = {
  id: string
  code: string
  title: Record<string, string>
  requires_document: boolean
}

export type ExcuseTemplateList = { items: ExcuseTemplate[] }

/** A file of a thread line with a one-hour download URL. */
export type ExcuseAttachment = {
  file_id: string
  name: string
  mime: string
  size: number
  download_url: string
}

export type ExcuseMessage = {
  id: string
  author_id: string
  author_name: string
  body: string
  attachments: ExcuseAttachment[]
  created_at: string
}

/** An excuse; `thread` is filled on the detail and after a mutation. */
export type Excuse = {
  id: string
  student_id: string
  student_name: string
  origin: ExcuseOrigin
  status: ExcuseStatus
  template: ExcuseTemplate | null
  reason: string
  starts_on: string
  /** Null: open-ended. */
  ends_on: string | null
  lesson_ids: string[]
  subject_ids: string[]
  created_by: string
  decided_by: string | null
  decided_at: string | null
  decision_comment: string | null
  created_at: string
  updated_at: string
  thread: ExcuseMessage[]
}

export type ExcuseList = Page<Excuse>

/** `status` filters the list; `student_id` is for staff and administrators. */
export type MyExcusesParams = { status?: ExcuseStatus } & Pick<PageParams, "cursor">
export type StaffExcusesParams = MyExcusesParams & { student_id?: string }

/** Body of `POST /v1/me/excuses`. */
export type ExcuseRequestBody = {
  template_id: string
  starts_on: string
  ends_on?: string | null
  lesson_ids?: string[]
  subject_ids?: string[]
  reason?: string
  file_ids?: string[]
}

/** Body of `POST /v1/staff/excuses` (an exclusion by the curator); `starts_on` defaults to today. */
export type ExcuseExclusionBody = {
  student_id: string
  template_id: string
  starts_on?: string | null
  ends_on?: string | null
  lesson_ids?: string[]
  subject_ids?: string[]
  reason?: string | null
}

/** Body of `PATCH /v1/staff/excuses/{id}`: closes an open-ended excuse. */
export type ExcuseEndBody = { ends_on: string }

/** Body of approve, reject and revoke. */
export type ExcuseDecisionBody = { comment?: string | null }

/** Body of the thread post of the student, staff and admin routes (`.../excuses/{id}/messages`). */
export type ExcuseMessageBody = { body?: string | null; file_ids?: string[] }
