// MCP call log: a person's own calls (ID app) and everyone's (admin console).

import { api } from "../client"
import type { components } from "../generated/openapi"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"

export const MCP_OUTCOMES = ["ok", "denied", "rate_limited", "not_found", "invalid", "error"] as const
export type McpOutcome = (typeof MCP_OUTCOMES)[number]

export type McpActivityItem = components["schemas"]["McpActivityItem"]
export type McpActivityPage = components["schemas"]["McpActivityPage"]
export type AdminMcpActivityItem = components["schemas"]["AdminMcpActivityItem"]
export type AdminMcpActivityPage = components["schemas"]["AdminMcpActivityPage"]
export type McpActivitySummary = components["schemas"]["McpActivitySummary"]

export type McpActivityParams = {
  connector_id?: string
  tool?: string
  outcome?: McpOutcome
  from?: string
  to?: string
  cursor?: string
}

export type AdminMcpActivityParams = McpActivityParams & {
  user_id?: string
  server?: "student" | "lms" | "admin"
}

/** GET /v1/id/me/connectors/activity — bearer; the caller's own MCP calls, newest first. */
export function getIdMeConnectorsActivity(params?: McpActivityParams, opts?: RequestOptions): Promise<McpActivityPage> {
  return api.get<McpActivityPage>("/v1/id/me/connectors/activity", { ...opts, query: params })
}
export const getIdMeConnectorsActivityQuery = (params?: McpActivityParams) =>
  queryOptions({
    queryKey: keys.id.connectorActivity(params),
    queryFn: ({ signal }) => getIdMeConnectorsActivity(params, { signal }),
  })

/** GET /v1/admin/mcp/activity — admin; every read is written to the audit log. */
export function getAdminMcpActivity(
  params?: AdminMcpActivityParams,
  opts?: RequestOptions,
): Promise<AdminMcpActivityPage> {
  return api.get<AdminMcpActivityPage>("/v1/admin/mcp/activity", { ...opts, query: params })
}
export const getAdminMcpActivityQuery = (params?: AdminMcpActivityParams) =>
  queryOptions({
    queryKey: keys.admin.mcpActivity(params),
    queryFn: ({ signal }) => getAdminMcpActivity(params, { signal }),
  })

/** GET /v1/admin/mcp/activity/summary — admin; calls and errors per tool. */
export function getAdminMcpActivitySummary(
  params?: { from?: string; to?: string },
  opts?: RequestOptions,
): Promise<McpActivitySummary> {
  return api.get<McpActivitySummary>("/v1/admin/mcp/activity/summary", { ...opts, query: params })
}
export const getAdminMcpActivitySummaryQuery = (params?: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: keys.admin.mcpActivitySummary(params),
    queryFn: ({ signal }) => getAdminMcpActivitySummary(params, { signal }),
  })
