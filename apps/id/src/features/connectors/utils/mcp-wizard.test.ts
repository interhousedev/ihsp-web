/** UF-MCP-05, MCP-5: the setup wizard's rules, kept apart from the screens so they can be checked without rendering. */
import { describe, expect, test } from "bun:test"
import type { OAuthSettingsResponse } from "@ihsp/api"
import enMessages from "../../../../messages/en.json"
import {
  isSafeRedirectUri,
  MCP_LINKS,
  NOTE_CODES,
  noteKey,
  oauthRows,
  parseLinkedText,
  sectionsFor,
  WIZARD_SERVICES,
} from "./mcp-wizard"

const oauth: OAuthSettingsResponse = {
  issuer: "https://id.ihsu.uz",
  discovery_url: "https://id.ihsu.uz/.well-known/openid-configuration",
  authorization_endpoint: "https://id.ihsu.uz/oauth/auth",
  token_endpoint: "https://id.ihsu.uz/oauth/token",
  revocation_endpoint: "https://id.ihsu.uz/oauth/revoke",
  registration_endpoint: "https://id.ihsu.uz/oauth/register",
  jwks_uri: "https://id.ihsu.uz/.well-known/jwks.json",
  protected_resource_metadata_url: "https://mcp.ihsu.uz/.well-known/oauth-protected-resource",
  resource: "https://mcp.ihsu.uz/mcp/student",
  audience: "mcp-student",
  scopes: ["lms.courses.read", "grades.read"],
  client_scopes: "openid offline_access lms.courses.read grades.read",
  code_challenge_method: "S256",
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  token_endpoint_auth_methods: ["client_secret_post", "none"],
  redirect_uris: ["https://chatgpt.com/connector_platform_oauth_redirect"],
  redirect_uri_patterns: ["https://claude.ai/api/mcp/auth_callback/*"],
  own_client_route: "/v1/id/me/mcp-clients",
}

describe("wizard services", () => {
  test("offers ChatGPT, Gemini, Claude and Custom in that order", () => {
    expect(WIZARD_SERVICES).toEqual(["chatgpt", "gemini", "claude", "custom"])
  })
})

describe("linked text", () => {
  test("turns an allowlisted [label](key) into a link with the known address", () => {
    expect(parseLinkedText("See [the help](chatgptHelp) first.")).toEqual([
      { type: "text", text: "See " },
      { type: "link", label: "the help", href: MCP_LINKS.chatgptHelp },
      { type: "text", text: " first." },
    ])
  })

  test("keeps the label as plain text for a key that is not allowlisted", () => {
    const segments = parseLinkedText("Go to [the site](evil)")
    expect(segments.every((segment) => segment.type === "text")).toBe(true)
    expect(segments.map((segment) => (segment.type === "text" ? segment.text : "")).join("")).toContain("the site")
  })

  test("never turns a raw address in the text into a link", () => {
    const segments = parseLinkedText("[x](javascript:alert(1)) and https://evil.example")
    expect(segments.some((segment) => segment.type === "link")).toBe(false)
  })
})

describe("sections", () => {
  test("shows every path the service supports", () => {
    expect(sectionsFor(["oauth_dcr", "oauth_client", "static_token"])).toEqual({
      connectInApp: true,
      ownClient: true,
      staticToken: true,
    })
  })

  test("shows only the in-app connection when the service needs nothing else", () => {
    expect(sectionsFor(["oauth_dcr"])).toEqual({ connectInApp: true, ownClient: false, staticToken: false })
  })
})

describe("redirect URIs", () => {
  test("accepts https and loopback http addresses", () => {
    expect(isSafeRedirectUri("https://chatgpt.com/connector_platform_oauth_redirect")).toBe(true)
    expect(isSafeRedirectUri("http://localhost:8080/callback")).toBe(true)
    expect(isSafeRedirectUri("http://127.0.0.1:9000/callback")).toBe(true)
  })

  test("rejects other schemes, plain http and empty values", () => {
    expect(isSafeRedirectUri("javascript:alert(1)")).toBe(false)
    expect(isSafeRedirectUri("http://example.org/callback")).toBe(false)
    expect(isSafeRedirectUri("")).toBe(false)
  })
})

describe("OAuth settings to copy", () => {
  test("the custom service shows every setting, one copy row per value", () => {
    const rows = oauthRows(oauth, "custom")
    expect(rows.find((row) => row.key === "issuer")?.value).toBe("https://id.ihsu.uz")
    expect(rows.find((row) => row.key === "scopes")?.value).toBe("lms.courses.read grades.read")
    expect(rows.some((row) => row.key === "token_endpoint")).toBe(true)
    expect(rows.some((row) => row.key === "own_client_route")).toBe(true)
    expect(rows.every((row) => row.value.length > 0)).toBe(true)
  })

  test("the chat services show only what their client form needs", () => {
    const keys = oauthRows(oauth, "chatgpt").map((row) => row.key)
    expect(keys).toContain("redirect_uris")
    expect(keys).not.toContain("jwks_uri")
  })
})

describe("notes", () => {
  test("every machine note code has a translated key", () => {
    for (const code of NOTE_CODES) {
      expect(noteKey(code)).toBe(`connectors.mcp.notes.${code}`)
      const notes: Record<string, string> = enMessages.connectors.mcp.notes
      expect(typeof notes[code]).toBe("string")
    }
  })
})
