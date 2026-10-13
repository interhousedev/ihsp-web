// AI assistants (backend § API contract → "AI assistants (B9)" and Schemas).

import type { PageParams } from "./common"

export type AssistantKind = "student" | "admin" | "lms_author"

export type ChatItem = {
  id: string
  assistant: AssistantKind
  title: string
  last_message_at: string
  pending_approvals: number
  /** The course of an author chat (`assistant: "lms_author"`); null for the other assistants. */
  course_id: string | null
  /** The model class of the chat (`fast` or `smart`). */
  tier: "fast" | "smart"
}

/** A page the web search found, numbered for the `⟦w1⟧` chips in the answer text. */
export type WebResult = {
  n: number
  title: string
  url: string
  site: string
  snippet: string
  why: string
  /** True when the answer cites this page. */
  cited: boolean
  /** `db`: from the platform's own database (shown as "Из базы IHSP"). */
  origin?: "web" | "db"
}

/** `GET /v1/ai/web-search`: whether web search is on and today's searches (a Discover deep run costs `deep_cost`). */
export type WebQuota = {
  enabled: boolean
  used: number
  /** `null`: unlimited (staff). */
  limit: number | null
  /** `null`: unlimited (staff). */
  remaining: number | null
  resets_at: string
  max_results: number
  deep_cost: number
}

/** A document made by the `make_document` tool; shown as a file card with a download. */
export type DocumentCard = {
  file_id: string
  name: string
  kind: "docx" | "xlsx" | "pptx"
  size: number
}

export type ToolCallView = {
  id: string
  tool: string
  access: "read" | "write"
  status: "running" | "pending_approval" | "rejected" | "expired" | "superseded" | "done" | "failed"
  note: string
  preview: {
    title: string
    fields: { label: string; value: string; sensitive: boolean }[]
    items: string[]
  } | null
  reject_reason: string | null
  expires_at: string | null
  /** Set for a finished `make_document` call. */
  document?: DocumentCard | null
}

export type ChatMessageView = {
  seq: number
  role: "user" | "assistant"
  text: string
  file_ids: string[]
  tool_calls: ToolCallView[]
  created_at: string
  /** Pages of the message's web search; `⟦w1⟧` chips in `text` point at them. */
  web: WebResult[]
  /** The caller's rating of an assistant message; `null` until they rate it. */
  feedback: "up" | "down" | null
  /** What the assistant did while answering, in order (AI-STEPS). */
  steps?: AgentStep[]
}

// TODO(contract): replace with generated
/** One action of the assistant while it answered: a file it read, a search, a tool call (AI-STEPS). */
export type AgentStep = {
  id: string
  kind: "read_file" | "web_search" | "retrieve" | "open_view" | "create" | "tool" | "think"
  /** English fallback label (a tool name for `tool`); the web shows a translated label per `kind`. */
  label: string
  /** A name to show: a file name, a plan title, a count of results. */
  target?: string | null
  /** An id the web can open: a file id, a plan id, an artifact id. */
  ref?: string | null
  status: "running" | "done" | "failed"
  started_at?: string | null
  duration_ms?: number | null
}

export type ChatDetail = ChatItem & { messages: ChatMessageView[]; shared: boolean }

export type UsageInfo = {
  /** `limit: null`: no cap (Administration). */
  session: { used: number; limit: number | null; resets_at: string | null }
  day: { used: number; limit: number | null; resets_at: string | null }
  /** Smart-tier messages left this week (Monday to Monday, Tashkent); `null`: unlimited (staff) or no smart tier. */
  smart_remaining?: number | null
  smart_limit?: number | null
  smart_resets_at?: string | null
}

export type TurnResult = {
  chat: ChatItem
  new_messages: ChatMessageView[]
  status: "done" | "awaiting_approval" | "limit_reached"
  usage: UsageInfo
}

export type ChatsParams = PageParams & { assistant?: AssistantKind; q?: string; course_id?: string }
/** `tier` picks the model class of a new chat (P2): `fast` (default) or `smart`. */
export type ChatCreateBody = { assistant: AssistantKind; tier?: "fast" | "smart"; course_id?: string }
export type ChatPatchBody = { title: string }
/** `command` + `args` is a slash command (`cards`, `quiz`, ...) that the server maps to a prompt or tool; `text` may then be empty. */
export type ChatMessageBody = {
  text: string
  file_ids: string[]
  web_search?: boolean
  command?: string
  args?: string
}
export type ToolCallRejectBody = { reason?: string }
export type MessageFeedbackBody = { rating: "up" | "down"; comment?: string }
/** The author assistant's budget is read per course (the server checks `edit` on it). */
export type UsageParams = { assistant?: AssistantKind; course_id?: string }
