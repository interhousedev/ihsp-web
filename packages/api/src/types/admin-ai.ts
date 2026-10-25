// Limits & usage (admin): runtime AI limits, per-user extensions and the usage report (`/v1/admin/ai/*`).

/** One editable limit: the value in force, the environment default and its bounds. */
export type LimitItem = {
  key: string
  group: string
  /** Translation key of the label; the web falls back to `key` for a limit it has no text for. */
  label_key: string
  /** tokens, count, steps, hours, bytes or switch (TODO(contract): a 0/1 on-off limit). */
  unit: string
  /** session, day, week, minute or hour; null for a standing limit. */
  period: string | null
  minimum: number
  maximum: number
  /** TODO(contract): true when -1 (no cap, shown as unlimited) is a valid value. */
  unlimitable: boolean
  /** The value in force; -1 means no cap. */
  value: number | null
  default: number | null
  overridden: boolean
  /** The settings' description (English); a hint for limits without a translation. */
  description: string
}

export type LimitsResponse = { limits: LimitItem[] }

/** Partial update: a value sets the limit, `null` resets it to its environment default. */
export type LimitsBody = { limits: Record<string, number | null> }

export type UsageTotals = {
  tokens_in: number
  tokens_out: number
  cached: number
  calls: number
  failed: number
  cost_usd: number
}

export type UsageRow = UsageTotals & {
  key: string
  /** Cost in US dollars of each feature in this group. */
  cost_by_feature: Record<string, number>
}

export type UsageTopUser = UsageTotals & {
  user_id: string
  name: string
  login: string | null
  role: string
}

export type UsageMonth = {
  /** YYYY-MM (Tashkent). */
  month: string
  cost_usd: number
  projected_usd: number
  days_elapsed: number
  days_in_month: number
}

export type UsageGroupBy = "day" | "task" | "model" | "role" | "feature" | "user"

export type UsageResponse = {
  from: string
  to: string
  group_by: UsageGroupBy
  generated_at: string
  totals: UsageTotals
  rows: UsageRow[]
  top_users: UsageTopUser[]
  month: UsageMonth
  today: UsageTotals
}

export type AdminUsageParams = { from?: string; to?: string; group_by?: UsageGroupBy }

/** A grant for one student: a multiplier and/or explicit values, until a date, with a note. */
export type ExtensionBody = {
  multiplier?: number | null
  values?: Record<string, number>
  expires_on?: string | null
  note?: string
}

export type ExtensionItem = {
  user_id: string
  user_name: string
  login: string | null
  multiplier: number | null
  values: Record<string, number>
  expires_on: string | null
  note: string
  /** False once the expiry date has passed. */
  active: boolean
  updated_at: string
}

export type ExtensionsResponse = { items: ExtensionItem[] }
export type ExtensionsParams = { user_id?: string }

// The two types below are hand-written until `bun run sync:openapi` brings the backend's
// `/v1/admin/ai/users/{user_id}/access` into the generated document; then replace them.
/** The AI scopes Administration revoked from one user (`true` blocks the scope). */
export type AiAccessItem = { user_id: string; ai_chat_blocked: boolean; ai_notebooks_blocked: boolean }
export type AiAccessBody = { ai_chat_blocked: boolean; ai_notebooks_blocked: boolean }

export type AdminStudentItem = { id: string; name: string; login: string | null }
export type StudentsResponse = { items: AdminStudentItem[] }
