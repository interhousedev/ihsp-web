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
}

/** `GET /v1/ai/web-search`: whether web search is on and today's searches (a Discover deep run costs `deep_cost`). */
export type WebQuota = {
  enabled: boolean
  used: number
  limit: number
  remaining: number
  resets_at: string
  max_results: number
  deep_cost: number
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
}

export type ChatDetail = ChatItem & { messages: ChatMessageView[]; shared: boolean }

export type UsageInfo = {
  session: { used: number; limit: number; resets_at: string | null }
  day: { used: number; limit: number; resets_at: string | null }
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
export type ChatMessageBody = { text: string; file_ids: string[]; web_search?: boolean }
export type ToolCallRejectBody = { reason?: string }
export type MessageFeedbackBody = { rating: "up" | "down"; comment?: string }
/** The author assistant's budget is read per course (the server checks `edit` on it). */
export type UsageParams = { assistant?: AssistantKind; course_id?: string }
