// Admin insights: system health, usage and marks (GET /v1/admin/insights).

export type DayCount = { date: string; count: number }

export type SystemHealth = {
  db: boolean
  redis: boolean
  /** Jobs read by a worker and not acknowledged yet; null without a queue. */
  queue_pending: number | null
  /** Jobs waiting for a worker; null when Redis cannot say. */
  queue_lag: number | null
  logins_24h: number
  failed_logins_24h: number
}

export type StorageUsage = { bytes: number; files: number; by_scope: Record<string, number> }

export type UsageInsights = { sign_ins: DayCount[]; ai_tokens: DayCount[]; storage: StorageUsage }

export type MarksInsights = { distribution: Record<string, number> }

export type Insights = {
  generated_at: string
  system: SystemHealth
  usage: UsageInsights
  marks: MarksInsights
}
