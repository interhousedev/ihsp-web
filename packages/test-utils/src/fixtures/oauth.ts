import type { OauthLogoutResponse, TokenResponse } from "@ihsp/api"

export const tokenResponse: TokenResponse = {
  access_token: "test-access-token",
  token_type: "Bearer",
  expires_in: 900,
}

/** What `POST /v1/oauth/refresh` returns: a different token than the first one. */
export const refreshedTokenResponse: TokenResponse = {
  access_token: "test-access-token-refreshed",
  token_type: "Bearer",
  expires_in: 900,
}

export const logoutResponse: OauthLogoutResponse = {
  logout_url: "http://localhost:4444/oauth2/sessions/logout?id_token_hint=test",
}
