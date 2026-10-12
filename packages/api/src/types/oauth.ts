// Identity — OAuth token handler (backend § API contract → "Identity — OAuth token handler and login app").

export type TokenResponse = { access_token: string; token_type: "Bearer"; expires_in: number }

/** Body of `POST /v1/oauth/token`; the same `client_id` is sent in `X-IHSP-Client`. */
export type OauthTokenBody = {
  client_id: string
  code: string
  code_verifier: string
  redirect_uri: string
}

export type OauthRefreshBody = { client_id: string }
export type OauthLogoutBody = { client_id: string }

/** Hydra end-session URL. */
export type OauthLogoutResponse = { logout_url: string }

export type OauthTelegramBody = { client_id: "sp" | "staff"; init_data: string }

/** Hydra token hook payload and response; only the backend and Hydra use them. */
export type TokenHookPayload = Record<string, unknown>
export type TokenHookResponse = Record<string, unknown>
