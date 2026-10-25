// Identity — OAuth token handler. Cookie endpoints send `credentials: "include"` and `X-IHSP-Client`.

import { api } from "../client"
import type { RequestOptions } from "../query"
import type {
  OauthLogoutBody,
  OauthLogoutResponse,
  OauthRefreshBody,
  OauthTelegramBody,
  OauthTokenBody,
  TokenHookPayload,
  TokenHookResponse,
  TokenResponse,
} from "../types/oauth"

/** POST /v1/oauth/token — none + `X-IHSP-Client`; sets the cookie `rt_<client_id>`. */
export function postOauthToken(body: OauthTokenBody, opts?: RequestOptions): Promise<TokenResponse> {
  return api.post<TokenResponse>("/v1/oauth/token", body, {
    ...opts,
    auth: "none",
    credentials: "include",
    headers: { "X-IHSP-Client": body.client_id },
  })
}

/** POST /v1/oauth/refresh — cookie; rotates the cookie. */
export function postOauthRefresh(body: OauthRefreshBody, opts?: RequestOptions): Promise<TokenResponse> {
  return api.post<TokenResponse>("/v1/oauth/refresh", body, {
    ...opts,
    auth: "none",
    credentials: "include",
    headers: { "X-IHSP-Client": body.client_id },
  })
}

/** POST /v1/oauth/logout — cookie; clears the cookie and revokes the refresh token. */
export function postOauthLogout(body: OauthLogoutBody, opts?: RequestOptions): Promise<OauthLogoutResponse> {
  return api.post<OauthLogoutResponse>("/v1/oauth/logout", body, {
    ...opts,
    auth: "none",
    credentials: "include",
    headers: { "X-IHSP-Client": body.client_id },
  })
}

/** POST /v1/oauth/telegram — none; mini app login, no cookie. */
export function postOauthTelegram(body: OauthTelegramBody, opts?: RequestOptions): Promise<TokenResponse> {
  return api.post<TokenResponse>("/v1/oauth/telegram", body, { ...opts, auth: "none" })
}

/** POST /v1/oauth/token-hook — hook (`Authorization: Bearer <TOKENS__SERVICE_TOKEN>`); called by Hydra, never by the web. */
export function postOauthTokenHook(
  payload: TokenHookPayload,
  serviceToken: string,
  opts?: RequestOptions,
): Promise<TokenHookResponse> {
  return api.post<TokenHookResponse>("/v1/oauth/token-hook", payload, {
    ...opts,
    auth: "none",
    headers: { Authorization: `Bearer ${serviceToken}` },
  })
}
