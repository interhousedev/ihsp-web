// Sharing notebooks and files: by a link that requires sign-in, or with named people.

import type { NotebookItem, SourceItem, SourceKind } from "./notebooks"

export type ShareVia = "direct" | "link"

export type SharePerson = {
  user_id: string
  name: string
  via: ShareVia
  created_at: string
}

export type NotebookShares = {
  link_active: boolean
  people: SharePerson[]
  /** Kinds of source a recipient cannot see (chats, lesson, course and library material). */
  hidden_source_kinds: SourceKind[]
}

export type FileShares = {
  link_active: boolean
  people: SharePerson[]
}

/** The token is returned once; only its hash is stored. */
export type ShareLink = { token: string }

export type ShareRecipient = { id: string; name: string }

export type SharedNotebook = NotebookItem & { owner_name: string }

export type LinkedSet = {
  notebook_id: string
  available: boolean
  title: string | null
  emoji: string | null
  sources: SourceItem[]
}

export type SharedFile = {
  id: string
  name: string
  content_type: string
  byte_size: number
  created_at: string
  owner_name: string
}
