import type { ScopeCatalog } from "@ihsp/api"

/** Tool names a scope allows, from the MCP scope catalog of the consent's server (empty when unknown). */
export function toolsForScope(catalog: ScopeCatalog | undefined, server: string | null, scope: string): string[] {
  if (!catalog) return []
  const entries = catalog.servers.filter((item) => server === null || item.server === server)
  for (const entry of entries) {
    const found = entry.scopes.find((item) => item.scope === scope)
    if (found) return found.tools
  }
  return []
}
