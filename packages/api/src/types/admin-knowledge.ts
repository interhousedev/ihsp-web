// School knowledge base (admin): entries the assistant searches (`/v1/admin/knowledge`).

/** One entry; `score` is set only in a search (`q`). */
export type KnowledgeEntry = {
  id: string
  key: string
  title: string | null
  value: string
  tags: string[]
  author_id: string
  created_at: string
  updated_at: string
  score?: number | null
}

export type KnowledgeEntryPage = {
  items: KnowledgeEntry[]
  total: number
  limit: number
  offset: number
}

export type KnowledgeEntryInput = {
  key: string
  title?: string | null
  value: string
  tags?: string[]
}

/** Only the sent fields change. */
export type KnowledgeEntryPatch = {
  key?: string | null
  title?: string | null
  value?: string | null
  tags?: string[] | null
}

export type KnowledgeParams = {
  q?: string | null
  tags?: string[] | null
  limit?: number
  offset?: number
}
