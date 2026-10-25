// Broadcasts (backend § API contract → "Notifications and broadcasts (B8)" and Schemas).

import type { PageParams, PersonRef, Role } from "./common"

export type Audience = { everyone: boolean; roles: Role[]; group_ids: string[]; semesters: number[] }

export type BroadcastInput = {
  title: string
  text: string
  media_file_ids: string[]
  audience: Audience
}

export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled"

export type BroadcastItem = BroadcastInput & {
  id: string
  status: BroadcastStatus
  scheduled_at: string | null
  created_via: "ui" | "assistant"
  author: PersonRef
  stats: { total: number; sent: number; failed: number; blocked: number } | null
  created_at: string
}

export type BroadcastsParams = PageParams & { status?: BroadcastStatus }
/** Only drafts and scheduled broadcasts can be edited. */
export type BroadcastPatchBody = Partial<BroadcastInput>
export type AudienceCountBody = { audience: Audience }
export type AudienceCount = { count: number }
export type BroadcastSendBody = { scheduled_at?: string }
