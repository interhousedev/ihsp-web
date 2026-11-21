// AI harness (admin): connectors, pipelines, request registry, prompt versions and analytics.

import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  AiConnector,
  AiConnectorCreateBody,
  AiConnectorPatchBody,
  AiConnectorsResponse,
  AiConnectorTestResult,
  AiPipeline,
  AiPipelineBody,
  AiPipelinesResponse,
  AiPromptDiff,
  AiPromptDiffParams,
  AiPromptRef,
  AiPromptSizesResponse,
  AiPromptVersionsResponse,
  AiRequestsParams,
  AiRequestsResponse,
  AiRequestStatsParams,
  AiRequestStatsResponse,
  AiAnalyticsRange,
  AiSpendDailyResponse,
  AiSpendParams,
  AiSpendResponse,
  AiTracing,
  AiTracingBody,
} from "../types/admin-ai-harness"

const BASE = "/v1/admin/ai"

/** Query keys of the harness, all under one prefix so a mutation refetches the lot. */
export const aiHarnessKeys = {
  all: () => ["admin", "ai-harness"] as const,
  connectors: () => ["admin", "ai-harness", "connectors"] as const,
  pipelines: () => ["admin", "ai-harness", "pipelines"] as const,
  tracing: () => ["admin", "ai-harness", "tracing"] as const,
  requests: (filters?: object) => ["admin", "ai-harness", "requests", filters ?? {}] as const,
  versions: (ref: object) => ["admin", "ai-harness", "versions", ref] as const,
  diff: (params: object) => ["admin", "ai-harness", "diff", params] as const,
  analytics: (kind: string, filters?: object) => ["admin", "ai-harness", "analytics", kind, filters ?? {}] as const,
}

/** GET /v1/admin/ai/connectors — admin; configured connectors (never a secret) and the kinds. */
export const getAiConnectors = (opts?: RequestOptions) => api.get<AiConnectorsResponse>(`${BASE}/connectors`, opts)
export const getAiConnectorsQuery = () =>
  queryOptions({ queryKey: aiHarnessKeys.connectors(), queryFn: ({ signal }) => getAiConnectors({ signal }) })

/** POST /v1/admin/ai/connectors — admin; the secret goes to the vault first. */
export const createAiConnector = (body: AiConnectorCreateBody, opts?: RequestOptions) =>
  api.post<AiConnector>(`${BASE}/connectors`, body, opts)

/** PATCH /v1/admin/ai/connectors/{id} — admin; a built-in connector gets a database override. */
export const patchAiConnector = (id: string, body: AiConnectorPatchBody, opts?: RequestOptions) =>
  api.patch<AiConnector>(`${BASE}/connectors/${seg(id)}`, body, opts)

/** DELETE /v1/admin/ai/connectors/{id} — admin; 409 `connector_in_use` while a pipeline routes to it. */
export const deleteAiConnector = (id: string, opts?: RequestOptions) =>
  api.delete<void>(`${BASE}/connectors/${seg(id)}`, opts)

/** POST /v1/admin/ai/connectors/{id}/test — admin; reachability and latency. */
export const testAiConnector = (id: string, opts?: RequestOptions) =>
  api.post<AiConnectorTestResult>(`${BASE}/connectors/${seg(id)}/test`, undefined, opts)

/** GET /v1/admin/ai/pipelines — admin; the routes, the effective route and the environment default. */
export const getAiPipelines = (opts?: RequestOptions) => api.get<AiPipelinesResponse>(`${BASE}/pipelines`, opts)
export const getAiPipelinesQuery = () =>
  queryOptions({ queryKey: aiHarnessKeys.pipelines(), queryFn: ({ signal }) => getAiPipelines({ signal }) })

/** PUT /v1/admin/ai/pipelines/{pipeline} — admin; each field nullable (null falls through to the environment). */
export const putAiPipeline = (pipeline: string, body: AiPipelineBody, opts?: RequestOptions) =>
  api.put<AiPipeline>(`${BASE}/pipelines/${seg(pipeline)}`, body, opts)

/** DELETE /v1/admin/ai/pipelines/{pipeline} — admin; back to the environment. */
export const deleteAiPipeline = (pipeline: string, opts?: RequestOptions) =>
  api.delete<void>(`${BASE}/pipelines/${seg(pipeline)}`, opts)

/** GET /v1/admin/ai/tracing — admin; the Langfuse project (never the secret key). */
export const getAiTracing = (opts?: RequestOptions) => api.get<AiTracing>(`${BASE}/tracing`, opts)
export const getAiTracingQuery = () =>
  queryOptions({ queryKey: aiHarnessKeys.tracing(), queryFn: ({ signal }) => getAiTracing({ signal }) })

/** PUT /v1/admin/ai/tracing — admin; the secret key goes to the vault, write-only. */
export const putAiTracing = (body: AiTracingBody, opts?: RequestOptions) =>
  api.put<AiTracing>(`${BASE}/tracing`, body, opts)

/** DELETE /v1/admin/ai/tracing — admin; back to the environment's project. */
export const deleteAiTracing = (opts?: RequestOptions) => api.delete<AiTracing>(`${BASE}/tracing`, opts)

/** GET /v1/admin/ai/requests — admin; the registered AI requests. */
export const getAiRequests = (params?: AiRequestsParams, opts?: RequestOptions) =>
  api.get<AiRequestsResponse>(`${BASE}/requests`, { ...opts, query: params })
export const getAiRequestsQuery = (params?: AiRequestsParams) =>
  queryOptions({
    queryKey: aiHarnessKeys.requests(params),
    queryFn: ({ signal }) => getAiRequests(params, { signal }),
  })

const promptPath = ({ task, name }: AiPromptRef) => `${BASE}/prompts/${seg(task)}/${seg(name)}`

/** GET /v1/admin/ai/prompts/{task}/{name}/versions — admin; versions without their text. */
export const getAiPromptVersions = (ref: AiPromptRef, opts?: RequestOptions) =>
  api.get<AiPromptVersionsResponse>(`${promptPath(ref)}/versions`, {
    ...opts,
    query: ref.locale === undefined ? undefined : { locale: ref.locale },
  })
export const getAiPromptVersionsQuery = (ref: AiPromptRef) =>
  queryOptions({
    queryKey: aiHarnessKeys.versions(ref),
    queryFn: ({ signal }) => getAiPromptVersions(ref, { signal }),
  })

/** GET /v1/admin/ai/prompts/{task}/{name}/diff — admin; unified diff between two versions. */
export const getAiPromptDiff = (params: AiPromptDiffParams, opts?: RequestOptions) => {
  const { from, to, locale, ...ref } = params
  return api.get<AiPromptDiff>(`${promptPath(ref)}/diff`, { ...opts, query: { from, to, locale } })
}
export const getAiPromptDiffQuery = (params: AiPromptDiffParams) =>
  queryOptions({
    queryKey: aiHarnessKeys.diff(params),
    queryFn: ({ signal }) => getAiPromptDiff(params, { signal }),
  })

/** GET /v1/admin/ai/analytics/prompt-sizes — admin; characters and ≈ tokens per prompt version. */
export const getAiPromptSizesQuery = (params?: { task?: string; name?: string }) =>
  queryOptions({
    queryKey: aiHarnessKeys.analytics("prompt-sizes", params),
    queryFn: ({ signal }) =>
      api.get<AiPromptSizesResponse>(`${BASE}/analytics/prompt-sizes`, { signal, query: params }),
  })

/** GET /v1/admin/ai/analytics/requests — admin; calls and averages per request, day, user or pipeline. */
export const getAiRequestStatsQuery = (params?: AiRequestStatsParams) =>
  queryOptions({
    queryKey: aiHarnessKeys.analytics("requests", params),
    queryFn: ({ signal }) => api.get<AiRequestStatsResponse>(`${BASE}/analytics/requests`, { signal, query: params }),
  })

/** GET /v1/admin/ai/analytics/spend — admin; micro-USD per day, request or user. */
export const getAiSpendQuery = (params?: AiSpendParams) =>
  queryOptions({
    queryKey: aiHarnessKeys.analytics("spend", params),
    queryFn: ({ signal }) => api.get<AiSpendResponse>(`${BASE}/analytics/spend`, { signal, query: params }),
  })

/** GET /v1/admin/ai/analytics/spend/daily — admin; the day × request matrix (top 20 requests, the rest "other"). */
export const getAiSpendDailyQuery = (params?: AiAnalyticsRange & { request_id?: string; user_id?: string }) =>
  queryOptions({
    queryKey: aiHarnessKeys.analytics("spend-daily", params),
    queryFn: ({ signal }) => api.get<AiSpendDailyResponse>(`${BASE}/analytics/spend/daily`, { signal, query: params }),
  })
