import type { AdminStudentItem, ExtensionItem, LimitItem, UsageGroupBy, UsageResponse, UsageRow } from "@ihsp/api"

/** A few editable limits, one per group, at their environment defaults. */
export const adminLimits: LimitItem[] = [
  {
    key: "ai_daily_tokens_student",
    group: "assistant",
    label_key: "admin-limit-ai-daily-tokens-student",
    unit: "tokens",
    period: "day",
    minimum: 0,
    maximum: 1_000_000_000,
    value: 600_000,
    default: 600_000,
    unlimitable: true,
    overridden: false,
    description: "Student assistant tokens per day.",
  },
  {
    key: "ai_session_hours",
    group: "assistant",
    label_key: "admin-limit-ai-session-hours",
    unit: "hours",
    period: "session",
    minimum: 1,
    maximum: 720,
    value: 5,
    default: 5,
    unlimitable: false,
    overridden: false,
    description: "Length of an assistant budget window.",
  },
  {
    key: "ai_smart_requests_per_week_student",
    group: "smart",
    label_key: "admin-limit-ai-smart-requests-per-week-student",
    unit: "count",
    period: "week",
    minimum: 0,
    maximum: 100_000,
    value: 3,
    default: 3,
    unlimitable: true,
    overridden: false,
    description: "Smart-tier requests a student may send per week.",
  },
  {
    key: "nb_chat_per_minute",
    group: "notebooks",
    label_key: "admin-limit-nb-chat-per-minute",
    unit: "count",
    period: "minute",
    minimum: 0,
    maximum: 100_000,
    value: 10,
    default: 10,
    unlimitable: false,
    overridden: false,
    description: "Notebook chat messages per minute.",
  },
  {
    key: "web_search_per_day_student",
    group: "web_search",
    label_key: "admin-limit-web-search-per-day-student",
    unit: "count",
    period: "day",
    minimum: 0,
    maximum: 100_000,
    value: 10,
    default: 10,
    unlimitable: true,
    overridden: false,
    description: "Web searches a student may start per day.",
  },
  {
    key: "lms_ai_chat_per_minute",
    group: "lms",
    label_key: "admin-limit-lms-ai-chat-per-minute",
    unit: "count",
    period: "minute",
    minimum: 0,
    maximum: 100_000,
    value: 12,
    default: 12,
    unlimitable: false,
    overridden: false,
    description: "Author assistant messages per minute.",
  },
]

export const adminStudents: AdminStudentItem[] = [
  { id: "01a1276c-6b4c-73e1-8076-000000000101", name: "Aziza Karimova", login: "aziza.karimova" },
]

export const adminExtensions: ExtensionItem[] = [
  {
    user_id: "01a1276c-6b4c-73e1-8076-000000000102",
    user_name: "Bobur Rashidov",
    login: "bobur.rashidov",
    multiplier: 3,
    values: {},
    expires_on: "2026-12-31",
    note: "Thesis",
    active: true,
    updated_at: "2026-10-05T09:00:00Z",
  },
]

const DAY_ROWS: UsageRow[] = [
  {
    key: "2026-10-05",
    tokens_in: 120_000,
    tokens_out: 30_000,
    cached: 1_000,
    calls: 40,
    failed: 1,
    cost_usd: 1.2,
    cost_by_feature: { assistant: 0.8, studio: 0.4 },
  },
  {
    key: "2026-10-06",
    tokens_in: 60_000,
    tokens_out: 15_000,
    cached: 500,
    calls: 20,
    failed: 0,
    cost_usd: 0.6,
    cost_by_feature: { assistant: 0.6 },
  },
  {
    key: "2026-10-07",
    tokens_in: 30_000,
    tokens_out: 5_000,
    cached: 0,
    calls: 10,
    failed: 0,
    cost_usd: 0.3,
    cost_by_feature: { notebook_chat: 0.3 },
  },
]

const MODEL_ROWS: UsageRow[] = [
  {
    key: "anthropic/claude-haiku-5.5",
    tokens_in: 180_000,
    tokens_out: 40_000,
    cached: 1_000,
    calls: 60,
    failed: 1,
    cost_usd: 1.9,
    cost_by_feature: { assistant: 1.4, studio: 0.5 },
  },
  {
    key: "google/gemini-3.5-flash-lite",
    tokens_in: 30_000,
    tokens_out: 10_000,
    cached: 0,
    calls: 10,
    failed: 0,
    cost_usd: 0.2,
    cost_by_feature: { web_search: 0.2 },
  },
]

const ROLE_ROWS: UsageRow[] = [
  {
    key: "student",
    tokens_in: 200_000,
    tokens_out: 45_000,
    cached: 1_000,
    calls: 65,
    failed: 1,
    cost_usd: 1.9,
    cost_by_feature: { assistant: 1.4, studio: 0.5 },
  },
  {
    key: "teacher",
    tokens_in: 10_000,
    tokens_out: 5_000,
    cached: 0,
    calls: 5,
    failed: 0,
    cost_usd: 0.2,
    cost_by_feature: { lms_author: 0.2 },
  },
]

/** The usage report of the admin page, grouped as asked (the figures are the same for every range). */
export function usageReport(groupBy: UsageGroupBy): UsageResponse {
  const rows = groupBy === "model" ? MODEL_ROWS : groupBy === "role" ? ROLE_ROWS : DAY_ROWS
  return {
    from: "2026-10-05",
    to: "2026-10-07",
    group_by: groupBy,
    generated_at: "2026-10-07T09:00:00Z",
    totals: { tokens_in: 210_000, tokens_out: 50_000, cached: 1_000, calls: 75, failed: 1, cost_usd: 2.1 },
    rows,
    top_users: [
      {
        user_id: "01a1276c-6b4c-73e1-8076-000000000101",
        name: "Aziza Karimova",
        login: "aziza.karimova",
        role: "student",
        tokens_in: 90_000,
        tokens_out: 20_000,
        cached: 0,
        calls: 30,
        failed: 0,
        cost_usd: 1.1,
      },
    ],
    month: {
      month: "2026-10",
      cost_usd: 2.1,
      projected_usd: 65.1,
      days_elapsed: 7,
      days_in_month: 31,
    },
    today: { tokens_in: 40_000, tokens_out: 10_000, cached: 0, calls: 12, failed: 0, cost_usd: 0.9 },
  }
}
