import type { McpSetupAuthMode, McpSetupService, OAuthSettingsResponse } from "@ihsp/api"

/** The AI apps the wizard offers, in the order it shows them (MCP-5). */
export const WIZARD_SERVICES: readonly McpSetupService[] = ["chatgpt", "gemini", "claude", "custom"]

/**
 * Addresses a message may link to. Messages refer to them by key (`[label](key)`), so a translation can never
 * point at an address that is not listed here.
 */
export const MCP_LINKS = {
  chatgptHelp: "https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt",
  geminiHelp: "https://support.google.com/gemini/answer/17209137",
  geminiEnterprise:
    "https://docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server/set-up-custom-mcp-server",
  claudeRemote: "https://claude.com/docs/connectors/custom/remote-mcp",
} as const

export type McpLinkKey = keyof typeof MCP_LINKS

export type LinkedSegment = { type: "text"; text: string } | { type: "link"; label: string; href: string }

const LINK_PATTERN = /\[([^\]]+)\]\(([A-Za-z]+)\)/g

/** Splits `text` at `[label](key)` markers. A key outside `MCP_LINKS` leaves its label as plain text. */
export function parseLinkedText(text: string): LinkedSegment[] {
  const segments: LinkedSegment[] = []
  let last = 0
  for (const match of text.matchAll(LINK_PATTERN)) {
    const index = match.index ?? 0
    if (index > last) segments.push({ type: "text", text: text.slice(last, index) })
    const label = match[1] ?? ""
    const key = match[2] ?? ""
    const href = Object.prototype.hasOwnProperty.call(MCP_LINKS, key) ? MCP_LINKS[key as McpLinkKey] : null
    segments.push(href ? { type: "link", label, href } : { type: "text", text: label })
    last = index + match[0].length
  }
  if (last < text.length) segments.push({ type: "text", text: text.slice(last) })
  return segments
}

/** The machine codes `GET /v1/id/me/mcp-setup` may return in `notes`; each has a translation. */
export const NOTE_CODES = [
  "business_enterprise_edu_full_mcp",
  "pro_read_fetch_only",
  "gemini_app_us_18_personal_account_keep_activity_on",
  "gemini_enterprise_admin_sets_up_client_and_pkce",
  "gemini_web_generated_redirect",
  "gemini_cli_redirect",
  "free_plan_one_custom_connector",
  "team_enterprise_owner_adds_connector",
  "static_headers_beta_owner_only",
  "dcr_needs_allowlisted_redirect_uri",
] as const

export function noteKey(code: string): string {
  return `connectors.mcp.notes.${code.replace(/[^A-Za-z0-9_]/g, "_")}`
}

/** Which parts of the instructions a service needs. */
export function sectionsFor(authModes: readonly McpSetupAuthMode[]): {
  connectInApp: boolean
  ownClient: boolean
  staticToken: boolean
} {
  return {
    connectInApp: authModes.includes("oauth_dcr"),
    ownClient: authModes.includes("oauth_client"),
    staticToken: authModes.includes("static_token"),
  }
}

/** A redirect address the wizard will let the user register: https, or plain http on a loopback host. */
export function isSafeRedirectUri(value: string): boolean {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return false
  }
  if (url.protocol === "https:") return true
  return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")
}

export type OAuthRow = { key: keyof OAuthSettingsResponse; value: string }

/** The keys the chat services' own forms ask for; the custom service gets every setting. */
const CORE_KEYS: readonly (keyof OAuthSettingsResponse)[] = [
  "issuer",
  "authorization_endpoint",
  "token_endpoint",
  "resource",
  "audience",
  "scopes",
  "redirect_uris",
]

const ALL_KEYS: readonly (keyof OAuthSettingsResponse)[] = [
  "issuer",
  "discovery_url",
  "authorization_endpoint",
  "token_endpoint",
  "revocation_endpoint",
  "registration_endpoint",
  "jwks_uri",
  "protected_resource_metadata_url",
  "resource",
  "audience",
  "scopes",
  "client_scopes",
  "code_challenge_method",
  "grant_types",
  "response_types",
  "token_endpoint_auth_methods",
  "redirect_uris",
  "redirect_uri_patterns",
  "own_client_route",
]

/** One copy row per setting; lists keep their own spaces or line breaks as the value. Empty settings are left out. */
export function oauthRows(oauth: OAuthSettingsResponse, service: McpSetupService): OAuthRow[] {
  const keys = service === "custom" ? ALL_KEYS : CORE_KEYS
  return keys.flatMap((key) => {
    const raw = oauth[key]
    const value = Array.isArray(raw) ? raw.join(key === "redirect_uris" ? "\n" : " ") : String(raw ?? "")
    return value ? [{ key, value }] : []
  })
}
