// Composition endpoints (backend § API contract → "Composition (I2)" and Schemas).

import type { BroadcastItem } from "./broadcasts"
import type { HomeworkItem, StudentAttendance } from "./classwork"
import type { PersonRef, Role, SubjectRef } from "./common"
import type { FileItem } from "./files"
import type { FlashcardSearchItem } from "./flashcards"
import type { AuditItem, SessionItem, TelegramAccount } from "./id"
import type { AdminUser } from "./id-admin"
import type { SemesterGrades, SyncRunItem } from "./marks"
import type { GroupItem, LessonItem, StudentProfile } from "./schedule"

export type Alert = {
  kind: "emis_reauth" | "no_subgroup" | "files_expiring" | "pending_approvals" | "sync_failed"
  params: Record<string, unknown>
  action_url: string | null
}

export type SearchResults = {
  subjects: SubjectRef[]
  lessons: LessonItem[]
  /** Search hits carry no overdue count: only the to-do lists and Today say how late an item is. */
  homework: Omit<HomeworkItem, "days_overdue">[]
  files: FileItem[]
  flashcard_sets: FlashcardSearchItem[]
  /** Notebooks whose title or a source title matched. */
  notebooks: NotebookSearchItem[]
  /** Recent marks of the subjects whose name matched (students). */
  marks: MarkSearchItem[]
  library_items: LibrarySearchItem[]
}

export type NotebookSearchItem = {
  id: string
  title: string
  emoji: string | null
  source_count: number
  matched_sources: string[]
}

export type MarkSearchItem = {
  subject: SubjectRef
  type: string
  value: number
  date: string
  lesson_id: string | null
}

export type LibrarySearchItem = {
  id: string
  slug: string | null
  title: string
  author_label: string
  kind: string
}

export type SendOutboundMailBody = {
  to: string[]
  subject: string
  body: string
  /** A file from My files. */
  attachment_file_id?: string | null
}

export type OutboundMailSent = {
  message_id: string
  to: string[]
  attachment_name: string | null
}

export type AdminDashboard = {
  today: { lessons: number; cancelled: number; teacher_needed: number }
  missing_attendance: { teacher: PersonRef; count: number }[]
  sync: { last_run: SyncRunItem | null; needs_reauth: number }
  scheduled_broadcasts: BroadcastItem[]
}

export type Student360 = {
  profile: StudentProfile & { status: string; roles: Role[] }
  timetable_week: LessonItem[]
  grades: SemesterGrades
  attendance: StudentAttendance
  telegram: TelegramAccount[]
  sessions: SessionItem[]
  audit: AuditItem[]
}

export type TeacherProfile = {
  user: AdminUser
  timetable_week: LessonItem[]
  missing_attendance: LessonItem[]
  curated_groups: GroupItem[]
}

export type SearchParams = { q: string }
/** The URL is shown once; asking again rotates the token. */
export type CalendarTokenResponse = { url: string }
export type GroupStat = { group_id: string; attendance_rate: number | null; average_gpa: number | null }
