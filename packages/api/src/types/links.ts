// Links, shares, lesson resources, moderation (backend § API contract → "Links, shares, lesson resources, room pages (B7)").

import type { PageParams, PersonRef } from "./common"
import type { FileItem } from "./files"

export type ResourceItem = {
  link_id: string
  lesson_id: string
  role: "material" | "attachment" | "homework"
  kind: "url" | "file"
  short_url: string
  title: string
  author: PersonRef
  hidden: boolean
  file: FileItem | null
  created_at: string
  /** `emis`: brought by EMIS (the author is named "EMIS"); `user`: added by a person. */
  source: "user" | "emis"
}

export type LinkItem = {
  id: string
  slug: string
  kind: "url" | "file" | "chat" | "flashcard_set"
  /** Full short or share URL. */
  url: string
  target_url: string | null
  file: FileItem | null
  title: string | null
  lesson_id: string | null
  /** The chat or flash card set a share points at; null for short links and lesson resources. */
  target_id: string | null
  share_mode: "snapshot" | "live" | null
  hits: number
  created_at: string
  expires_at: string | null
  revoked_at: string | null
  disabled: boolean
}

export type ModerationItem = {
  link: LinkItem
  owner: PersonRef
  reports: number
  last_reported_at: string | null
  disabled_reason: string | null
}

// --- Request bodies and query parameters ---

export type LinkCreateBody = { kind: "url" | "file"; target_url?: string; file_id?: string }
/** `target_id` keeps the shares of one chat or flash card set (backend addition). */
export type MyLinksParams = PageParams & { kind?: LinkItem["kind"]; target_id?: string }

export type ShareCreateBody = {
  kind: "chat" | "flashcard_set"
  target_id: string
  share_mode?: "snapshot" | "live"
  expires_at?: string
}

export type ResourceCreateBody = {
  role: "material" | "attachment"
  kind: "url" | "file"
  target_url?: string
  file_id?: string
  also_lesson_ids?: string[]
}
export type ResourceHideBody = { hidden: boolean }

export type ModerationQueueParams = Pick<PageParams, "cursor" | "limit">
/** `q` is a slug, a share URL or a login. */
export type ModerationSearchParams = { q: string }
export type LinkDisableBody = { reason: string }
