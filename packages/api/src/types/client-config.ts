// Public client configuration (GET /v1/public/client-config): feature flags and documentation links, no sign-in needed.

export type ClientConfig = {
  features: { login_cues: boolean }
  /** Documentation links; `null` when the operator has not configured one. */
  docs: { personal_tokens_url: string | null; entrance_devices_url: string | null }
}
