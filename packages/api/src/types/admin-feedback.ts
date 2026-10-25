// Admin — "Call for improvements" (feedback from users, handled by staff): `/v1/admin/feedback`.

export type AdminFeedbackKind = "idea" | "bug" | "other"

export type AdminFeedbackArea =
  | "id"
  | "my"
  | "staff"
  | "admin"
  | "lms"
  | "library"
  | "share"
  | "bot"
  | "ai"
  | "notebooks"
  | "mail"
  | "other"

export type AdminFeedbackStatus = "new" | "in_review" | "planned" | "done" | "rejected"

export type AdminFeedbackSource = "web" | "bot"

export type AdminFeedbackAttachment = {
  file_id: string
  name: string
  mime: string
  size: number
  /** Presigned URL of the file, valid for one hour. */
  download_url: string
}

export type AdminFeedbackReporter = {
  user_id: string
  display_name: string
  roles: string[]
  group_name: string | null
}

export type AdminFeedbackListItem = {
  id: string
  kind: AdminFeedbackKind
  area: AdminFeedbackArea
  title: string
  description: string
  status: AdminFeedbackStatus
  source: AdminFeedbackSource
  created_at: string
  attachments: AdminFeedbackAttachment[]
  response_count: number
  reporter: AdminFeedbackReporter
}

export type AdminFeedbackChannel = "telegram" | "mail"

export type AdminFeedbackDelivery = {
  channel: AdminFeedbackChannel
  status: "sent" | "failed" | "unavailable"
}

export type AdminFeedbackResponse = {
  id: string
  text: string
  attachments: AdminFeedbackAttachment[]
  channels: AdminFeedbackChannel[]
  deliveries: AdminFeedbackDelivery[]
  author_name: string
  created_at: string
}

export type AdminFeedbackDetail = AdminFeedbackListItem & {
  page_url: string | null
  responses: AdminFeedbackResponse[]
}

/** Query of `GET /v1/admin/feedback`; empty filters are left out. */
export type AdminFeedbackListParams = {
  status?: AdminFeedbackStatus
  kind?: AdminFeedbackKind
  area?: AdminFeedbackArea
  cursor?: string
  limit?: number
}

export type AdminFeedbackStatusPatch = { status: AdminFeedbackStatus }

/** Body of `POST /v1/admin/feedback/{id}/responses`. */
export type AdminFeedbackResponseInput = {
  text: string
  attachment_file_ids: string[]
  channels: AdminFeedbackChannel[]
}
