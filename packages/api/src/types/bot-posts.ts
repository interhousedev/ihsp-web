// Telegram bot posts tree (admin). Backend contract: /v1/admin/posts.

/** Text per locale; a missing or null locale is an empty value. */
export type BotPostLocalized = { uz?: string | null; ru?: string | null; en?: string | null }

export type BotPostAudience = "guest" | "student" | "both"

export type BotPostButton = {
  label: BotPostLocalized
  url: string
}

export type BotPost = {
  id: string
  parent_id: string | null
  slug: string
  title: BotPostLocalized
  /** Telegram HTML subset per locale. */
  body: BotPostLocalized
  audience: BotPostAudience
  sort_order: number
  published: boolean
  is_root: boolean
  buttons: BotPostButton[]
}

/** A post with its children, sorted by sort_order. The root is created on first use. */
export type BotPostTreeNode = BotPost & { children: BotPostTreeNode[] }

export type BotPostCreate = {
  parent_id?: string | null
  /** `^[a-z0-9][a-z0-9-]{0,63}$`. */
  slug: string
  title: BotPostLocalized
  body?: BotPostLocalized
  audience?: BotPostAudience
  sort_order?: number
  published?: boolean
  /** At most 8. */
  buttons?: BotPostButton[]
}

export type BotPostPatch = Partial<Omit<BotPostCreate, "parent_id">>

export type BotPostReorder = { parent_id: string | null; ids: string[] }

export type BotPostReorderResult = { items: BotPost[] }

export type BotPostMove = { parent_id: string | null }

/** Client-side field limits the backend enforces. */
export const BOT_POST_LIMITS = { title: 128, body: 4000, label: 64, buttons: 8 } as const
