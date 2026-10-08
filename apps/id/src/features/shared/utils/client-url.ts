import { getConfig } from "@ihsp/config"

/** Public URL of a first-party OAuth client (`LoginInfo.client_id`), or `null` for MCP and unknown clients. */
export function clientUrl(clientId: string): string | null {
  const config = getConfig()
  const urls: Record<string, string> = {
    id: config.ID_URL,
    sp: config.SP_URL,
    staff: config.STAFF_URL,
    admin: config.ADMIN_URL,
    lms: config.LMS_URL,
  }
  return urls[clientId] ?? null
}
