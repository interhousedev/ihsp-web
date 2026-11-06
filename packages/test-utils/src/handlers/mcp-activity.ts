import type { AdminMcpActivityPage, McpActivityPage, McpActivitySummary } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl } from "./utils"

const CALL: McpActivityPage["items"][number] = {
  id: "0000000c-0000-4000-8000-000000000001",
  created_at: "2026-11-05T09:00:00Z",
  connector_id: "0000000b-0000-4000-8000-000000000001",
  connector_name: "Claude Desktop",
  client_id: null,
  server: "student",
  tool: "get_marks",
  scope: "marks:read",
  read_only: true,
  outcome: "ok",
  error_code: null,
  error_id: null,
  duration_ms: 42,
  arguments: { subject_id: "s1", query: { len: 8 } },
  result_summary: { count: 3 },
  ip: "10.0.0.1",
}

const ADMIN_PAGE: AdminMcpActivityPage = {
  items: [{ ...CALL, user_id: "00000001-0000-4000-8000-000000000001" }],
  next_cursor: null,
}

const SUMMARY: McpActivitySummary = {
  items: [{ server: "student", tool: "get_marks", calls: 12, errors: 2 }],
}

/** The MCP call log: one call of the signed-in user, and the admin views of it. */
export const mcpActivityHandlers = [
  http.get(apiUrl("/v1/id/me/connectors/activity"), () =>
    HttpResponse.json<McpActivityPage>({ items: [CALL], next_cursor: null }),
  ),
  http.get(apiUrl("/v1/admin/mcp/activity"), () => HttpResponse.json(ADMIN_PAGE)),
  http.get(apiUrl("/v1/admin/mcp/activity/summary"), () => HttpResponse.json(SUMMARY)),
]
