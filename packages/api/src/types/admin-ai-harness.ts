// AI harness (admin): connectors, pipelines, request registry, prompt versions and analytics
// (`/v1/admin/ai/{connectors,pipelines,requests,analytics}*`). Hand-written to the contract until the OpenAPI client
// is regenerated. Money is `cost_micro` (millionths of a US dollar).

export type ConnectorKind = "openrouter" | "anthropic" | "openai_compatible" | "exa"

export type AiConnector = {
  id: string
  kind: ConnectorKind
  title: string
  base_url: string | null
  enabled: boolean
  has_secret: boolean
  secret_last4: string | null
  builtin: boolean
  source: "env" | "db"
}
export type AiConnectorsResponse = { items: AiConnector[]; kinds: ConnectorKind[] }
export type AiConnectorCreateBody = {
  id: string
  kind: ConnectorKind
  title: string
  base_url?: string | null
  api_key?: string
  headers?: Record<string, string>
}
export type AiConnectorPatchBody = { title?: string; base_url?: string | null; enabled?: boolean; api_key?: string }
export type AiConnectorTestResult = { ok: boolean; latency_ms: number | null; error: string | null }

export type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high"
export type AiPipelineRoute = {
  connector_id: string | null
  model: string | null
  reasoning_effort: ReasoningEffort | null
  updated_at?: string | null
}
export type AiPipelineEffective = {
  connector_id: string
  model: string
  reasoning_effort: ReasoningEffort
  source: "runtime" | "env"
}
export type AiPipeline = {
  pipeline: string
  tasks: string[]
  route: AiPipelineRoute
  effective: AiPipelineEffective
  env_default: Omit<AiPipelineEffective, "source">
}
export type AiPipelinesResponse = { items: AiPipeline[] }
export type AiPipelineBody = Pick<AiPipelineRoute, "connector_id" | "model" | "reasoning_effort">

export type AiRequestItem = {
  id: string
  owner_app: string
  task: string
  pipeline: string
  template_id: string
  args_schema: Record<string, unknown>
  tools: string[]
  summary: string
  published_at: string
  retired: boolean
  active_version: number
  code_version: number
  code_changed_since_active: boolean
}
export type AiRequestsResponse = { items: AiRequestItem[] }
export type AiRequestsParams = { owner_app?: string; pipeline?: string; include_retired?: boolean }

export type AiPromptRef = { task: string; name: string; locale?: string }
export type AiPromptVersionItem = {
  version: number
  locale: string
  source: "admin" | "code"
  active: boolean
  hash: string
  chars: number
  tokens_est: number
  created_at: string
  created_by: string | null
  note: string
  has_diff: boolean
}
export type AiPromptVersionsResponse = { items: AiPromptVersionItem[] }
export type AiPromptDiff = {
  task: string
  name: string
  locale: string
  from_version: number
  to_version: number
  diff: string
  chars_delta: number
  tokens_delta: number
}
export type AiPromptDiffParams = AiPromptRef & { from?: number; to?: number }

export type AiAnalyticsRange = { start?: string; end?: string }
export type AiPromptSizePoint = {
  task: string
  name: string
  locale: string
  version: number
  source: "admin" | "code"
  chars: number
  tokens_est: number
  created_at: string | null
  active: boolean
}
export type AiPromptSizesResponse = { items: AiPromptSizePoint[] }

export type AiRequestStatsGroup = "request" | "day" | "user" | "pipeline"
export type AiRequestStatsParams = AiAnalyticsRange & {
  group_by?: AiRequestStatsGroup
  request_id?: string
  pipeline?: string
  user_id?: string
}
export type AiRequestStatsTotals = {
  calls: number
  failed: number
  avg_prompt_tokens: number
  avg_prompt_chars: number
  avg_answer_chars: number
  avg_output_tokens: number
  avg_tool_calls: number
  cost_micro: number
}
export type AiRequestStatsRow = AiRequestStatsTotals & { key: string }
export type AiRequestStatsResponse = { items: AiRequestStatsRow[]; totals: AiRequestStatsTotals }

export type AiSpendBy = "day" | "request" | "user"
export type AiSpendParams = AiAnalyticsRange & { by?: AiSpendBy; request_id?: string; user_id?: string; limit?: number }
export type AiSpendRow = {
  key: string
  cost_micro: number
  calls: number
  users: number
  user: { id: string; full_name: string; role: string } | null
}
export type AiSpendResponse = { items: AiSpendRow[]; total_cost_micro: number }
export type AiSpendDailyRow = { day: string; request_id: string; cost_micro: number; calls: number }
export type AiSpendDailyResponse = { items: AiSpendDailyRow[] }
