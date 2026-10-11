import type { UsageInfo } from "@ihsp/api"

/** `resetsAt` is null when the backend has no reset time for the budget that is used up. */
export type LimitState = { reached: false } | { reached: true; scope: "session" | "day"; resetsAt: string | null }

/** Share of a budget that is used, 0 to 100. */
export function usagePercent(used: number, limit: number | null): number {
  if (limit === null || limit <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)))
}

/**
 * Whether the input must be disabled (AI-8). When both budgets are used up the later reset time wins, because
 * the student can write again only after both have reset.
 */
export function limitState(usage: UsageInfo | undefined): LimitState {
  if (!usage) return { reached: false }
  const sessionFull =
    usage.session.limit !== null && usage.session.limit > 0 && usage.session.used >= usage.session.limit
  const dayFull = usage.day.limit !== null && usage.day.limit > 0 && usage.day.used >= usage.day.limit
  if (!sessionFull && !dayFull) return { reached: false }
  const dayReset = usage.day.resets_at
  const sessionReset = usage.session.resets_at ?? dayReset
  if (sessionFull && dayFull) {
    return Date.parse(sessionReset ?? "") > Date.parse(dayReset ?? "")
      ? { reached: true, scope: "session", resetsAt: sessionReset }
      : { reached: true, scope: "day", resetsAt: dayReset }
  }
  return sessionFull
    ? { reached: true, scope: "session", resetsAt: sessionReset }
    : { reached: true, scope: "day", resetsAt: dayReset }
}

/**
 * The smart requests of this week, or null when the user has no weekly limit (staff) or the backend does not
 * report one. `resetsAt` is the Monday 00:00 (Tashkent) when the count starts again.
 */
export type SmartState = { remaining: number; limit: number; resetsAt: string | null } | null

export function smartState(usage: UsageInfo | undefined): SmartState {
  if (!usage || usage.smart_remaining == null || usage.smart_limit == null) return null
  return { remaining: usage.smart_remaining, limit: usage.smart_limit, resetsAt: usage.smart_resets_at ?? null }
}

/** Tokens as `12k` or `1.2M`, for the usage bar. */
export function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(value)
}
