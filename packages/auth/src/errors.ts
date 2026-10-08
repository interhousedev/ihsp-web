/** Why a login step failed; `code` is stable and has a message under `auth.*` in the shared messages. */
export type AuthErrorCode =
  | "state-mismatch" // missing or wrong `state`, or no PKCE data in sessionStorage
  | "oauth-error" // Hydra returned `?error=...`
  | "no-session" // the token exchange worked but the user could not be loaded

export class AuthError extends Error {
  readonly code: AuthErrorCode
  readonly detail: string | null

  constructor(code: AuthErrorCode, detail: string | null = null) {
    super(detail ? `${code}: ${detail}` : code)
    this.name = "AuthError"
    this.code = code
    this.detail = detail
  }
}
