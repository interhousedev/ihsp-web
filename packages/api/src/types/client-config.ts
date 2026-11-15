// Public client configuration (GET /v1/public/client-config): feature flags and documentation links, no sign-in needed.

export type ClientConfig = {
  features: { login_cues: boolean }
  /** Documentation links; `null` when the operator has not configured one. */
  /** Branding set by Administration; `lyceum_logo_url` is API-relative (prefix it with the API base URL). */
  branding: { lyceum_logo_url: string | null }
  docs: { personal_tokens_url: string | null; entrance_devices_url: string | null }
}
