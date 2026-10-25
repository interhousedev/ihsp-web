// Feedback: ideas and problem reports sent to the school team (`POST /v1/feedback` and its reads).

export type FeedbackKind = "idea" | "bug" | "other"

export type FeedbackArea =
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

export type FeedbackStatus = "new" | "in_review" | "planned" | "done" | "rejected"

export type FeedbackSource = "web" | "bot"

/** A file attached to a report or to a response (images are shown inline). */
export type FeedbackAttachment = {
  file_id: string
  name: string
  mime: string
  size: number
  /** Presigned URL of the file, valid for one hour. */
  download_url: string
}

export type FeedbackChannel = "telegram" | "mail"

export type FeedbackDelivery = {
  channel: FeedbackChannel
  status: "sent" | "failed" | "unavailable"
}

/** A response an administrator wrote for a report. */
export type FeedbackResponseOut = {
  id: string
  text: string
  attachments: FeedbackAttachment[]
  channels: FeedbackChannel[]
  deliveries: FeedbackDelivery[]
  author_name: string
  created_at: string
}

export type FeedbackOut = {
  id: string
  kind: FeedbackKind
  area: FeedbackArea
  title: string
  description: string
  status: FeedbackStatus
  source: FeedbackSource
  created_at: string
  attachments: FeedbackAttachment[]
  response_count: number
}

/** `GET /v1/feedback/{id}`: the report with its responses. */
export type FeedbackDetailOut = FeedbackOut & {
  responses: FeedbackResponseOut[]
}

/** `POST /v1/feedback`. Title 1-120 characters, description 1-4000, at most 10 attachments. */
export type FeedbackCreateBody = {
  kind: FeedbackKind
  area: FeedbackArea
  title: string
  description: string
  attachment_file_ids: string[]
  page_url?: string
}

export type FeedbackMineResponse = {
  items: FeedbackOut[]
}

export const FEEDBACK_TITLE_MAX = 120
export const FEEDBACK_DESCRIPTION_MAX = 4000
export const FEEDBACK_MAX_ATTACHMENTS = 10
