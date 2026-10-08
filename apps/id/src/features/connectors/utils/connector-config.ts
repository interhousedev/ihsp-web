import type { Connector, Role, ScopeCatalog } from "@ihsp/api"

export type McpServer = Connector["server"]

/** MCP-2: Administration connectors last at most 30 days; the others 30, 90 or 365. */
export function expiryOptions(server: McpServer): number[] {
  return server === "admin" ? [30] : [30, 90, 365]
}

/** Servers the user may connect to: those whose roles overlap the user's roles (UF-MCP-01 step 1). */
export function allowedServers(catalog: ScopeCatalog | undefined, roles: readonly Role[]): ScopeCatalog["servers"] {
  if (!catalog) return []
  return catalog.servers.filter((entry) => entry.roles.some((role) => roles.includes(role)))
}

export function mcpServerUrl(mcpUrl: string, server: McpServer): string {
  return `${mcpUrl.replace(/\/+$/, "")}/${server}`
}

/** The config an AI client needs: server URL and the bearer header (UF-MCP-01 step 5). */
export function connectorConfigSnippet(mcpUrl: string, server: McpServer, token: string): string {
  return JSON.stringify({ url: mcpServerUrl(mcpUrl, server), headers: { Authorization: `Bearer ${token}` } }, null, 2)
}

/** `study_planner` -> `Study planner`, for presets without a translation. */
export function humanizeKey(key: string): string {
  const text = key.replace(/[-_]+/g, " ").trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}
