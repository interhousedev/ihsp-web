// AI assistants (backend § API contract → "AI assistants (B9)" and Schemas).

import type { PageParams } from "./common"

export type AssistantKind = "student" | "admin"

export type ChatItem = {
  id: string
  assistant: AssistantKind
  title: string
  last_message_at: string
  pending_approvals: number
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

export type ChatsParams = PageParams & { assistant?: AssistantKind }
export type ChatCreateBody = { assistant: AssistantKind }
export type ChatPatchBody = { title: string }
export type ChatMessageBody = { text: string; file_ids: string[] }
export type ToolCallRejectBody = { reason?: string }
export type UsageParams = { assistant?: AssistantKind }
